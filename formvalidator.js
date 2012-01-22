/*
 * FormValidator 1.0 - JavaScript class for separate form validation (validation with multiple validators)
 *
 * http://vas3k.ru/work/form_validator
 *
 * Licensed under the LGPL licenses:
 *   http://www.gnu.org/licenses/lgpl.html
 *
 */

/**
 * Very useful method aka. constructor
 * @param form_id - id of validation form (without #)
 * @param rules - optional param to set initial rules array (@see this.addValidation)
 */
function FormValidator(form_id, rules) {
    this.form_id = form_id;
    this.form_obj = document.forms[form_id];
    this.rules = rules || [];
    this.checks = {
        "req": required_validator,
        "int": integer_validator,
        "float": float_validator,
        "min-len": min_len_validator,
        "max-len": max_len_validator,
        "min-val": min_value_validator,
        "max-val": max_value_validator,
        "email": email_validator,
        "regexp": regexp_validator
    };

    /*
     * Default error handlers
     *  alert - show alert on EACH error (only for debug, cause you're not stupid)
     *  color - highlight borders of input (color as param, default - red)
     *  color_label - highlight label text (color as param, default - red)
     *  flow - create block near input and show error dynamically (class as param, default - .flow_error)
     *  custom - user-defined callback function (as param), in this version there are no way to clean up results of it's manipulation
     *  one - show errors in one general block (id as param, default - error_block)
     *  block - show errors in special block for each input (block id = <field_name>_errors)
     */

    this.error_handler_type = {
        "color": "red"
    };
}

/**
 * Add input field to this validator
 * @param field_name - name (not id!) of field to validate
 * @param check - one of validation checks (@see this.checks)
 * @param error_msg - text string to display in cause of error
 */
FormValidator.prototype.addValidation = function(field_name, check, error_msg) {
    if (!field_name) return;
    var check_name = check;
    var check_param;
    if (check.indexOf("=") + 1) {
        check_name = check.split("=")[0];
        check_param = check.split("=")[1];
    }

    if (this.checks[check_name]) {
        this.rules.push({
            "field_name": field_name,
            "check": check_name,
            "param": check_param,
            "msg": error_msg
        });
    }
};

/**
 * Remove input field from this validator
 * @param field_name - name (not id!) of field
 * @param check - type of check (@see this.checks)
 */
FormValidator.prototype.removeValidation = function(field_name, check) {
    for (var i = 0; i < this.rules.length; i++) {
        if ((this.rules[i]["field_name"] == field_name) && (this.rules[i]["check"] == check)) {
            this.rules.splice(i, 1);
        }
    }
};

/**
 * Removes all validation, defined in this object
 */
FormValidator.prototype.clearAllValidations = function() {
    this.rules = [];
};

/**
 * Add custom validation function to this validator.
 * Be careful, you can replace and break default validator.
 * @param code - name of this validator
 * @param callback - validation function
 */
FormValidator.prototype.addCustomValidator = function(code, callback) {
    this.checks[code] = callback;
};

/**
 * Starts validation
 * @return true if valid, otherwise false
 */
FormValidator.prototype.validate = function() {
    if (!this.form_obj) {
        // Lazy binding. Last chance.
        this.form_obj = document.forms[this.form_id];
    }

    var rule = null;
    var check = null;
    var field_name = null;
    var field = null;
    var is_success = true;

    this.removeAllErrors();
    for (var i = 0; i < this.rules.length; i++) {
        // Run validation
        rule = this.rules[i];
        field_name = rule["field_name"];
        check = rule["check"];
        field = this.form_obj[field_name];
        if (!this.checks[check](field, rule)) {
            // Validation error, show message
            is_success = false;
            this.showError(field, rule);
        }
    }
    return is_success;
};

/**
 * Activates one type of error display
 * @param type - handler (@see this.error_handler_type in constructor)
 * @param param - often error handler needs a param (class name or callback function)
 */
FormValidator.prototype.addErrorHandler = function(type, param) {
    var param_in = param;
    switch (type) {
        case "color":
            param_in = param || "red";
            break;

        case "color_label":
            param_in = param || "red";
            associate_input_with_labels();
            break;

        case "flow":
            param_in = param || "flow_error";
            break;

        case "custom":
            param_in = param || function() {};
            break;

        case "one":
            param_in = param || "error_block";
            break;
    }
    this.error_handler_type[type] = param_in;
};

/**
 * Deactivates one of error handlers
 * @param type - handler name
 */
FormValidator.prototype.removeErrorHandler = function(type) {
    delete this.error_handler_type[type];
};

/*
 * Private methods
 * Usually, you don't need it
 */

/**
 * Clear form. Remove flow blocks, highlights, etc.
 * Usually you don't need to call it manually, but who knows.
 */
FormValidator.prototype.removeAllErrors = function() {
    var i = 0;
    // Remove flow blocks
    if (this.error_handler_type["flow"]) {
        var flow_blocks = get_elements_by_class_name(this.error_handler_type["flow"]);
        for (i = 0; i < flow_blocks.length; i++) {
            flow_blocks[i].parentNode.removeChild(flow_blocks[i]);
        }
    }

    // Remove input field highlights
    if (this.error_handler_type["color"]) {
        var field = null;
        for (i = 0; i < this.rules.length; i++) {
            field = this.form_obj[this.rules[i]["field_name"]];
            if (field) {
                field.style.borderColor = null;
            }
        }
    }

    // Remove label highlights
    if (this.error_handler_type["color_label"]) {
        var labels = document.getElementsByTagName('label');
        for (i = 0; i < labels.length; i++) {
            labels[i].style.color = null;
        }
    }

    // Clear and hide general error block
    if (this.error_handler_type["one"]) {
        var block = document.getElementById(this.error_handler_type["one"]);
        if (block) {
            block.innerHTML = "";
            block.style.display = "none";
        }
    }

    // Clear and hide all special blocks
    if (this.error_handler_type["block"]) {
        var block;
        for (i = 0; i < this.rules.length; i++) {
            block = document.getElementById(this.rules[i]["field_name"] + "_errors");
            if (block) {
                block.innerHTML = "";
                block.style.display = "none";
            }
        }
    }
};

/**
 * Shows than @param field does not passes validation @param rule
 */
FormValidator.prototype.showError = function(field, rule) {
    for (var type in this.error_handler_type) {
        switch (type) {
            case "alert":
                alert(rule["msg"]);
                break;

            case "color":
                field.style.borderColor = this.error_handler_type["color"];
                break;

            case "color_label":
                field.label.style.color = this.error_handler_type["color_label"];
                break;
            
            case "flow":
                var flow = document.createElement('div');
                flow.innerHTML = '<div class="' + this.error_handler_type["flow"] + '">' + rule["msg"] + '</div>';
                field.parentNode.appendChild(flow);
                break;

            case "custom":
                this.error_handler_type[type](field, rule);
                break;

            case "one":
                var block = document.getElementById(this.error_handler_type["one"]);
                if (block) {
                    block.innerHTML += rule["msg"] + "<br/>";
                    block.style.display = "block";
                }
                break;

            case "block":
                var block = document.getElementById(rule["field_name"] + "_errors");
                if (block) {
                    block.innerHTML += rule["msg"] + "<br/>";
                    block.style.display = "block";
                }
                break;
        }
    }
    field.focus();
};


/*
 * Helpers
 */
function get_elements_by_class_name(classname, node)  {
    if(!node) node = document.getElementsByTagName("body")[0];
    var a = [];
    var re = new RegExp('\\b' + classname + '\\b');
    var els = node.getElementsByTagName("*");
    for (var i = 0, j = els.length; i < j; i++) {
        if(re.test(els[i].className))a.push(els[i]);
    }
    return a;
}

function associate_input_with_labels() {
    // dirty old hack WHAHAH
    var labels = document.getElementsByTagName('label');
    for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor != '') {
             var elem = document.getElementById(labels[i].htmlFor);
             if (elem)
                elem.label = labels[i];
        }
    }
}


/*
 *  Validators
 */
function required_validator(field) {
    return field.value.trim();
}

function integer_validator(field) {
    var n = field.value.trim();
    return typeof n == 'number' && n % 1 == 0;
}

function float_validator(field) {
    var n = field.value.trim();
    return n === +n && n !== (n|0);
}

function min_len_validator(field, rule) {
    var n = field.value.trim();
    return n.length >= rule["param"];
}

function max_len_validator(field, rule) {
    var n = field.value.trim();
    return n.length <= rule["param"];
}

function min_value_validator(field, rule) {
    var n = field.value.trim();
    return n >= rule["param"];
}

function max_value_validator(field, rule) {
    var n = field.value.trim();
    return n <= rule["param"];
}

function email_validator(field) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(field.value.trim());
}

function regexp_validator(field, rule) {
    var re = new RegExp(rule["param"], "ig");
    return re.test(field.value.trim());
}
