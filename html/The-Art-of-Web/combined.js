function Suggestor(inputId, outputId, AjaxTarget, properties) {
    this.timeoutInterval = 10000;
    var input = document.getElementById(inputId);
    var output = document.getElementById(outputId);
    if (!input || !output) {
        return false;
    }
    input.addEventListener("keyup", this, false);
    output.addEventListener("keydown", this, false);
    output.addEventListener("keyup", this, false);
    var AjaxTarget = AjaxTarget;
    var regex = (properties && properties.regex) ? properties.regex : false;
    var delay = (properties && properties.delay) ? parseInt(properties.delay) : 250;
    var suggestIdx = 0;
    var searchTimer;
    this.extraParams = {};
    this.setParam = function(key, val) {
        this.extraParams[key] = val;
    };
    this.clearParam = function(key) {
        delete this.extraParams[key];
    };
    this.setTimeoutInterval = function(seconds) {
        this.timeoutInterval = seconds * 1000;
    };
    this.hide = function(setfocus) {
        if (this.hideOutputTimer) {
            window.clearTimeout(this.hideOutputTimer);
        }
        if (setfocus !== false) {
            input.focus();
        }
        output.style.display = "none";
    };
    this.setvalue = function(newVal, submitForm) {
        input.value = newVal;
        this.hide();
        if (submitForm === true) {
            var event;
            if (typeof(Event) === "function") {
                event = new Event("submit", {
                    cancelable: true
                });
            } else {
                event = document.createEvent('Event');
                event.initEvent('submit', false, true);
            }
            if (input.form.dispatchEvent(event)) {
                input.form.submit();
            }
        }
    };
    this.lookup = function(inputValue) {
        if (!inputValue) {
            this.hide();
        }
        if (regex !== false && !inputValue.match(regex)) {
            return false;
        }
        var params = [];
        params.q = inputValue;
        if (this.extraParams) {
            for (var x in this.extraParams) {
                params[x] = this.extraParams[x];
            }
        }
        if (typeof AjaxRequestXML == "undefined") {
            var script = document.createElement("script");
            script.onload = function() {
                (new AjaxRequestXML()).get(AjaxTarget, params, this.setHideOutputTimer);
            };
            script.src = "/scripts/AjaxRequestXML.js";
            document.head.appendChild(script);
            return true;
        } else {
            return (new AjaxRequestXML()).get(AjaxTarget, params, this.setHideOutputTimer);
        }
    };
    this.setHideOutputTimer = function() {
        if (this.hideOutputTimer) {
            window.clearTimeout(this.hideOutputTimer);
        }
        if (this.timeoutInterval > 0) {
            this.hideOutputTimer = window.setTimeout(function(_this) {
                _this.hide(false);
            }, this.timeoutInterval, this);
        }
    }.bind(this);
    this.inputkeyup = function(e) {
        var suggestArray;
        switch (e.keyCode) {
            case 9:
            case 13:
            case 27:
                this.hide();
                return false;
            case 38:
                suggestArray = output.getElementsByTagName("a");
                suggestIdx = suggestArray.length - 1;
                suggestArray[suggestIdx].focus();
                this.setHideOutputTimer();
                return false;
            case 40:
                suggestArray = output.getElementsByTagName("a");
                suggestIdx = 0;
                suggestArray[suggestIdx].focus();
                this.setHideOutputTimer();
                return false;
            default:
                if (searchTimer) {
                    window.clearTimeout(searchTimer);
                    this.setHideOutputTimer();
                }
                searchTimer = window.setTimeout(function(_this, _val) {
                    _this.lookup(_val);
                }, delay, this, input.value);
                return true;
        }
    };
    this.outputkeydown = function(e) {
        switch (e.keyCode) {
            case 9:
            case 38:
            case 40:
                e.preventDefault();
                return false;
        }
        return true;
    };
    this.outputkeyup = function(e) {
        switch (e.keyCode) {
            case 27:
                this.hide();
                return false;
            case 38:
                suggestIdx--;
                this.setHideOutputTimer();
                break;
            case 40:
                suggestIdx++;
                this.setHideOutputTimer();
                break;
        }
        var suggestArray = output.getElementsByTagName("a");
        if (suggestIdx < 0) {
            input.focus();
        } else if (suggestIdx >= suggestArray.length) {
            suggestIdx = suggestArray.length - 1;
        } else {
            suggestArray[suggestIdx].focus();
        }
        return false;
    };
    this.handleEvent = function(e) {
        if (e.target === input && e.type == "keyup") {
            return this.inputkeyup(e);
        } else {
            switch (e.type) {
                case "keydown":
                    return this.outputkeydown(e);
                case "keyup":
                    return this.outputkeyup(e);
            }
        }
    };
}(function(targetId, headingTag) {
    var target = document.getElementById(targetId);
    var headings = document.getElementsByTagName(headingTag || "h2");
    if (headings.length > 1) {
        var menuList = document.createElement("OL");
        var menuLink = document.createElement("A");
        menuLink.setAttribute("href", "#");
        menuLink.appendChild(document.createTextNode("\u2630 Submenu"));
        var listItem = document.createElement("LI");
        listItem.id = "submenu_trigger";
        listItem.className = "mobileonly";
        listItem.appendChild(menuLink);
        menuList.appendChild(listItem);
        for (var i = 0; i < headings.length; i++) {
            var anchorName = "";
            if (headings[i].id) {
                anchorName = headings[i].id;
            } else {
                anchorName = "section_" + i;
                headings[i].setAttribute("id", anchorName);
            }
            var headingText = headings[i].firstChild.nodeValue
            headings[i].firstChild.nodeValue = (i + 1) + ". " + headingText;
            var menuLink = document.createElement("A");
            menuLink.setAttribute("href", "#" + anchorName);
            menuLink.appendChild(document.createTextNode(headingText));
            var listItem = document.createElement("LI");
            listItem.appendChild(menuLink);
            menuList.appendChild(listItem);
            (function(idx) {
                menuLink.addEventListener("click", function(e) {
                    headings[idx].scrollIntoView(true);
                    e.preventDefault();
                }, false);
            })(i);
        }
        while (target.hasChildNodes()) target.removeChild(target.firstChild);
        target.appendChild(menuList);
    } else {
        target.parentNode.removeChild(target);
    }
})("submenu");
var openModalWindow = function(el) {
    var overlay = document.createElement("div");
    overlay.style.cssText = "position: absolute; top: 0; z-index: 1000; width: 100%; height: 100%; background: #000; opacity: 0.71; filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=70);";
    document.body.appendChild(overlay);
    var container = document.getElementById(el);
    container.style.cssText = "display: block; z-index: 1010; position: fixed; left: 50%; top: 50%; max-width: " + (0.8 * overlay.offsetWidth) + "px; max-height: " + (0.8 * overlay.offsetHeight) + "px; overflow: auto; box-shadow: 0 0 50px rgba(0,0,0,0.5);";
    var overflow = container.offsetHeight - document.documentElement.clientHeight;
    if (overflow > 0) {
        container.style.maxHeight = (parseInt(window.getComputedStyle(container).height) - overflow) + "px";
    }
    container.style.marginLeft = (-container.offsetWidth / 2) + "px";
    container.style.marginTop = (-container.offsetHeight / 2) + "px";
    var closeModal = function() {
        document.body.removeChild(overlay);
        container.style.display = "none";
        document.removeEventListener("keydown", overlayEscape, false);
    };
    var overlayEscape = function(e) {
        if (e.keyCode == 27) closeModal();
    }
    overlay.addEventListener("click", closeModal, false);
    document.addEventListener("keydown", overlayEscape, false);
};
window.addEventListener("DOMContentLoaded", function(e) {
    var arr = document.getElementsByClassName("show_feedback");
    for (var i = 0; i < arr.length; i++) {
        arr[i].addEventListener("click", function() {
            openModalWindow("feedback");
            document.getElementById("field_name").focus();
        }, false);
    }
    var nameValidityMsg = "Please enter your Name";
    var emailValidityMsg = "Please enter a valid Email address";
    var websiteValidityMsg = "Please enter a website URL starting with http://";
    var messageValidityMsg = "Please enter your comment or question";
    var captchaValidityMsg = "Please enter the five CAPTCHA digits (0-9) in the box provided";
    if (document.getElementById("feedback_form")) {
        var checkFeedbackForm = function(e) {
            if (this.name.value == "") {
                alert(nameValidityMsg);
                this.name.focus();
                e.preventDefault();
            } else if (this.email.value == "") {
                alert(emailValidityMsg);
                this.email.focus();
                e.preventDefault();
            } else if (this.message.value == "") {
                alert(messageValidityMsg);
                this.message.focus();
                e.preventDefault();
            } else if (!this.captcha.value.match(/^\d{5}$/)) {
                alert(captchaValidityMsg);
                this.captcha.focus();
                e.preventDefault();
            }
        };
        var feedbackForm = document.getElementById("feedback_form");
        feedbackForm.addEventListener("submit", checkFeedbackForm, false);
        var supports_input_validity = function() {
            var i = document.createElement("input");
            return "setCustomValidity" in i;
        }
        if (supports_input_validity()) {
            var fldName = feedbackForm.elements["name"];
            fldName.setCustomValidity(nameValidityMsg);
            fldName.addEventListener("keyup", function() {
                this.setCustomValidity(this.validity.valueMissing ? nameValidityMsg : "");
            }, false);
            var fldEmail = feedbackForm.elements["email"];
            fldEmail.setCustomValidity(emailValidityMsg);
            fldEmail.addEventListener("keyup", function() {
                this.setCustomValidity((this.validity.valueMissing || this.validity.typeMismatch) ? emailValidityMsg : "");
            }, false);
            var fldWebsite = feedbackForm.elements["website"];
            fldWebsite.addEventListener("keyup", function() {
                this.setCustomValidity((this.validity.typeMismatch || this.validity.patternMismatch) ? websiteValidityMsg : "");
            }, false);
            var fldMessage = feedbackForm.elements["message"];
            fldMessage.setCustomValidity(messageValidityMsg);
            fldMessage.addEventListener("keyup", function() {
                this.setCustomValidity(this.validity.valueMissing ? messageValidityMsg : "");
            }, false);
            var fldCaptcha = feedbackForm.elements["captcha_code"];
            fldCaptcha.setCustomValidity(captchaValidityMsg);
            fldCaptcha.addEventListener("keyup", function(e) {
                this.value = this.value.replace(/[^\d]+/g, "");
                this.setCustomValidity((this.validity.valueMissing || this.validity.patternMismatch) ? captchaValidityMsg : "");
            }, false);
        }
    }
}, false);

function Hilitor(id, tag) {
    var targetNode = document.getElementById(id) || document.body;
    var hiliteTag = tag || "MARK";
    var skipTags = new RegExp("^(?:" + hiliteTag + "|SCRIPT|FORM|SPAN)$");
    var colors = ["#ff6", "#a0ffff", "#9f9", "#f99", "#f6f"];
    var wordColor = [];
    var colorIdx = 0;
    var matchRegExp = "";
    var openLeft = false;
    var openRight = false;
    var endRegExp = new RegExp('^[^\\w]+|[^\\w]+$', "g");
    var breakRegExp = new RegExp('[^\\w\'-]+', "g");
    this.setEndRegExp = function(regex) {
        endRegExp = regex;
        return endRegExp;
    };
    this.setBreakRegExp = function(regex) {
        breakRegExp = regex;
        return breakRegExp;
    };
    this.setMatchType = function(type) {
        switch (type) {
            case "left":
                this.openLeft = false;
                this.openRight = true;
                break;
            case "right":
                this.openLeft = true;
                this.openRight = false;
                break;
            case "open":
                this.openLeft = this.openRight = true;
                break;
            default:
                this.openLeft = this.openRight = false;
        }
    };
    this.setRegex = function(input) {
        input = input.replace(endRegExp, "");
        input = input.replace(breakRegExp, "|");
        input = input.replace(/^\||\|$/g, "");
        if (input) {
            var re = "(" + input + ")";
            if (!this.openLeft) {
                re = "\\b" + re;
            }
            if (!this.openRight) {
                re = re + "\\b";
            }
            matchRegExp = new RegExp(re, "i");
            return matchRegExp;
        }
        return false;
    };
    this.getRegex = function() {
        var retval = matchRegExp.toString();
        retval = retval.replace(/(^\/(\\b)?|\(|\)|(\\b)?\/i$)/g, "");
        retval = retval.replace(/\|/g, " ");
        return retval;
    };
    this.hiliteWords = function(node) {
        if (node === undefined || !node) return;
        if (!matchRegExp) return;
        if (skipTags.test(node.nodeName)) return;
        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) this.hiliteWords(node.childNodes[i]);
        }
        if (node.nodeType == 3) {
            if ((nv = node.nodeValue) && (regs = matchRegExp.exec(nv))) {
                if (!wordColor[regs[0].toLowerCase()]) {
                    wordColor[regs[0].toLowerCase()] = colors[colorIdx++ % colors.length];
                }
                var match = document.createElement(hiliteTag);
                match.appendChild(document.createTextNode(regs[0]));
                match.style.backgroundColor = wordColor[regs[0].toLowerCase()];
                match.style.color = "#000";
                var after = node.splitText(regs.index);
                after.nodeValue = after.nodeValue.substring(regs[0].length);
                node.parentNode.insertBefore(match, after);
            }
        };
    };
    this.remove = function() {
        var arr = document.getElementsByTagName(hiliteTag);
        while (arr.length && (el = arr[0])) {
            var parent = el.parentNode;
            parent.replaceChild(el.firstChild, el);
            parent.normalize();
        }
    };
    this.apply = function(input) {
        this.remove();
        if (input === undefined || !(input = input.replace(/(^\s+|\s+$)/g, ""))) {
            return;
        }
        if (this.setRegex(input)) {
            this.hiliteWords(targetNode);
        }
        return matchRegExp;
    };
}(function() {
    var menuTrigger = document.getElementById("menu_trigger");
    var menuNode = document.getElementById("menu");
    var showHideMenu = function(e) {
        if (menuNode.className == "active") {
            menuNode.className = "";
        } else {
            menuNode.className = "active";
        }
        e.preventDefault();
    };
    menuTrigger.addEventListener("click", showHideMenu, false);
    var hideMenu = function(e) {
        menuNode.className = "menu";
    };
    document.addEventListener("click", hideMenu, false);
    var cancelBubble = function(e) {
        e.stopPropagation();
    };
    menuTrigger.addEventListener("click", cancelBubble, false);
    menuNode.addEventListener("click", cancelBubble, false);
})();
(function() {
    var menuNode;
    var menuTrigger = document.getElementById("submenu_trigger");
    var menuContainer = document.getElementById("submenu");
    if (!menuContainer) return;
    if (menuContainer.getElementsByTagName("OL")) {
        menuNode = menuContainer.getElementsByTagName("OL")[0];
    } else {
        return;
    }
    var showHideMenu = function(e) {
        if (menuContainer.className == "active") {
            menuContainer.className = "";
        } else {
            menuContainer.className = "active";
        }
        e.preventDefault();
    };
    menuTrigger.addEventListener("click", showHideMenu, false);
    var hideMenu = function(e) {
        menuContainer.className = "";
    };
    document.addEventListener("click", hideMenu, false);
    var cancelBubble = function(e) {
        e.stopPropagation();
    };
    menuNode.addEventListener("click", cancelBubble, false);
})();