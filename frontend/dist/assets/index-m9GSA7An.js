import { r as requireReact, a as requireReactDom, g as getDefaultExportFromCjs } from "./index-CcQBSAeU.js";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
var reactInputMask = { exports: {} };
var reactInputMask_production_min;
var hasRequiredReactInputMask_production_min;
function requireReactInputMask_production_min() {
  if (hasRequiredReactInputMask_production_min) return reactInputMask_production_min;
  hasRequiredReactInputMask_production_min = 1;
  function _interopDefault(e) {
    return e && "object" == typeof e && "default" in e ? e["default"] : e;
  }
  var React = _interopDefault(requireReact()), reactDom = requireReactDom();
  function _defaults2(e, t) {
    for (var n = Object.getOwnPropertyNames(t), a = 0; a < n.length; a++) {
      var i = n[a], r = Object.getOwnPropertyDescriptor(t, i);
      r && r.configurable && e[i] === void 0 && Object.defineProperty(e, i, r);
    }
    return e;
  }
  function _extends() {
    return (_extends = Object.assign || function(e) {
      for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t];
        for (var a in n) Object.prototype.hasOwnProperty.call(n, a) && (e[a] = n[a]);
      }
      return e;
    }).apply(this, arguments);
  }
  function _inheritsLoose(e, t) {
    e.prototype = Object.create(t.prototype), _defaults2(e.prototype.constructor = e, t);
  }
  function _objectWithoutPropertiesLoose(e, t) {
    if (null == e) return {};
    var n, a, i = {}, r = Object.keys(e);
    for (a = 0; a < r.length; a++) n = r[a], 0 <= t.indexOf(n) || (i[n] = e[n]);
    return i;
  }
  function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  var invariant = function(e, t, n, a, i, r, o, s) {
    if (!e) {
      var l;
      if (t === void 0) l = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
      else {
        var u = [n, a, i, r, o, s], c = 0;
        (l = new Error(t.replace(/%s/g, function() {
          return u[c++];
        }))).name = "Invariant Violation";
      }
      throw l.framesToPop = 1, l;
    }
  }, invariant_1 = invariant;
  function setInputSelection(e, t, n) {
    if ("selectionStart" in e && "selectionEnd" in e) e.selectionStart = t, e.selectionEnd = n;
    else {
      var a = e.createTextRange();
      a.collapse(true), a.moveStart("character", t), a.moveEnd("character", n - t), a.select();
    }
  }
  function getInputSelection(e) {
    var t = 0, n = 0;
    if ("selectionStart" in e && "selectionEnd" in e) t = e.selectionStart, n = e.selectionEnd;
    else {
      var a = document.selection.createRange();
      a.parentElement() === e && (t = -a.moveStart("character", -e.value.length), n = -a.moveEnd("character", -e.value.length));
    }
    return { start: t, end: n, length: n - t };
  }
  var defaultFormatChars = { 9: "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" }, defaultMaskChar = "_";
  function parseMask(e, t, n) {
    var a = "", i = "", r = null, o = [];
    if (t === void 0 && (t = defaultMaskChar), null == n && (n = defaultFormatChars), !e || "string" != typeof e) return { maskChar: t, formatChars: n, mask: null, prefix: null, lastEditablePosition: null, permanents: [] };
    var s = false;
    return e.split("").forEach(function(e2) {
      s = !s && "\\" === e2 || (s || !n[e2] ? (o.push(a.length), a.length === o.length - 1 && (i += e2)) : r = a.length + 1, a += e2, false);
    }), { maskChar: t, formatChars: n, prefix: i, mask: a, lastEditablePosition: r, permanents: o };
  }
  function isPermanentCharacter(e, t) {
    return -1 !== e.permanents.indexOf(t);
  }
  function isAllowedCharacter(e, t, n) {
    var a = e.mask, i = e.formatChars;
    if (!n) return false;
    if (isPermanentCharacter(e, t)) return a[t] === n;
    var r = i[a[t]];
    return new RegExp(r).test(n);
  }
  function isEmpty(n, e) {
    return e.split("").every(function(e2, t) {
      return isPermanentCharacter(n, t) || !isAllowedCharacter(n, t, e2);
    });
  }
  function getFilledLength(e, t) {
    var n = e.maskChar, a = e.prefix;
    if (!n) {
      for (; t.length > a.length && isPermanentCharacter(e, t.length - 1); ) t = t.slice(0, t.length - 1);
      return t.length;
    }
    for (var i = a.length, r = t.length; r >= a.length; r--) {
      var o = t[r];
      if (!isPermanentCharacter(e, r) && isAllowedCharacter(e, r, o)) {
        i = r + 1;
        break;
      }
    }
    return i;
  }
  function isFilled(e, t) {
    return getFilledLength(e, t) === e.mask.length;
  }
  function formatValue(e, t) {
    var n = e.maskChar, a = e.mask, i = e.prefix;
    if (!n) {
      for ((t = insertString(e, "", t, 0)).length < i.length && (t = i); t.length < a.length && isPermanentCharacter(e, t.length); ) t += a[t.length];
      return t;
    }
    if (t) return insertString(e, formatValue(e, ""), t, 0);
    for (var r = 0; r < a.length; r++) isPermanentCharacter(e, r) ? t += a[r] : t += n;
    return t;
  }
  function clearRange(n, e, a, t) {
    var i = a + t, r = n.maskChar, o = n.mask, s = n.prefix, l = e.split("");
    if (r) return l.map(function(e2, t2) {
      return t2 < a || i <= t2 ? e2 : isPermanentCharacter(n, t2) ? o[t2] : r;
    }).join("");
    for (var u = i; u < l.length; u++) isPermanentCharacter(n, u) && (l[u] = "");
    return a = Math.max(s.length, a), l.splice(a, i - a), e = l.join(""), formatValue(n, e);
  }
  function insertString(r, o, e, s) {
    var l = r.mask, u = r.maskChar, c = r.prefix, t = e.split(""), h = isFilled(r, o);
    return !u && s > o.length && (o += l.slice(o.length, s)), t.every(function(e2) {
      for (; i = e2, isPermanentCharacter(r, a = s) && i !== l[a]; ) {
        if (s >= o.length && (o += l[s]), t2 = e2, n = s, u && isPermanentCharacter(r, n) && t2 === u) return true;
        if (++s >= l.length) return false;
      }
      var t2, n, a, i;
      return !isAllowedCharacter(r, s, e2) && e2 !== u || (s < o.length ? o = u || h || s < c.length ? o.slice(0, s) + e2 + o.slice(s + 1) : (o = o.slice(0, s) + e2 + o.slice(s), formatValue(r, o)) : u || (o += e2), ++s < l.length);
    }), o;
  }
  function getInsertStringLength(a, e, t, i) {
    var r = a.mask, o = a.maskChar, n = t.split(""), s = i;
    return n.every(function(e2) {
      for (; n2 = e2, isPermanentCharacter(a, t2 = i) && n2 !== r[t2]; ) if (++i >= r.length) return false;
      var t2, n2;
      return (isAllowedCharacter(a, i, e2) || e2 === o) && i++, i < r.length;
    }), i - s;
  }
  function getLeftEditablePosition(e, t) {
    for (var n = t; 0 <= n; --n) if (!isPermanentCharacter(e, n)) return n;
    return null;
  }
  function getRightEditablePosition(e, t) {
    for (var n = e.mask, a = t; a < n.length; ++a) if (!isPermanentCharacter(e, a)) return a;
    return null;
  }
  function getStringValue(e) {
    return e || 0 === e ? e + "" : "";
  }
  function processChange(e, t, n, a, i) {
    var r = e.mask, o = e.prefix, s = e.lastEditablePosition, l = t, u = "", c = 0, h = 0, f = Math.min(i.start, n.start);
    if (n.end > i.start ? h = (c = getInsertStringLength(e, a, u = l.slice(i.start, n.end), f)) ? i.length : 0 : l.length < a.length && (h = a.length - l.length), l = a, h) {
      if (1 === h && !i.length) f = i.start === n.start ? getRightEditablePosition(e, n.start) : getLeftEditablePosition(e, n.start);
      l = clearRange(e, l, f, h);
    }
    return l = insertString(e, l, u, f), (f += c) >= r.length ? f = r.length : f < o.length && !c ? f = o.length : f >= o.length && f < s && c && (f = getRightEditablePosition(e, f)), u || (u = null), { value: l = formatValue(e, l), enteredString: u, selection: { start: f, end: f } };
  }
  function isWindowsPhoneBrowser() {
    var e = new RegExp("windows", "i"), t = new RegExp("phone", "i"), n = navigator.userAgent;
    return e.test(n) && t.test(n);
  }
  function isFunction(e) {
    return "function" == typeof e;
  }
  function getRequestAnimationFrame() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
  }
  function getCancelAnimationFrame() {
    return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
  }
  function defer(e) {
    return (!!getCancelAnimationFrame() ? getRequestAnimationFrame() : function() {
      return setTimeout(e, 1e3 / 60);
    })(e);
  }
  function cancelDefer(e) {
    (getCancelAnimationFrame() || clearTimeout)(e);
  }
  var InputElement = (function(c) {
    function e(e2) {
      var f = c.call(this, e2) || this;
      f.focused = false, f.mounted = false, f.previousSelection = null, f.selectionDeferId = null, f.saveSelectionLoopDeferId = null, f.saveSelectionLoop = function() {
        f.previousSelection = f.getSelection(), f.saveSelectionLoopDeferId = defer(f.saveSelectionLoop);
      }, f.runSaveSelectionLoop = function() {
        null === f.saveSelectionLoopDeferId && f.saveSelectionLoop();
      }, f.stopSaveSelectionLoop = function() {
        null !== f.saveSelectionLoopDeferId && (cancelDefer(f.saveSelectionLoopDeferId), f.saveSelectionLoopDeferId = null, f.previousSelection = null);
      }, f.getInputDOMNode = function() {
        if (!f.mounted) return null;
        var e3 = reactDom.findDOMNode(_assertThisInitialized(_assertThisInitialized(f))), t3 = "undefined" != typeof window && e3 instanceof window.Element;
        if (e3 && !t3) return null;
        if ("INPUT" !== e3.nodeName && (e3 = e3.querySelector("input")), !e3) throw new Error("react-input-mask: inputComponent doesn't contain input node");
        return e3;
      }, f.getInputValue = function() {
        var e3 = f.getInputDOMNode();
        return e3 ? e3.value : null;
      }, f.setInputValue = function(e3) {
        var t3 = f.getInputDOMNode();
        t3 && (f.value = e3, t3.value = e3);
      }, f.setCursorToEnd = function() {
        var e3 = getFilledLength(f.maskOptions, f.value), t3 = getRightEditablePosition(f.maskOptions, e3);
        null !== t3 && f.setCursorPosition(t3);
      }, f.setSelection = function(e3, t3, n2) {
        void 0 === n2 && (n2 = {});
        var a2 = f.getInputDOMNode(), i2 = f.isFocused();
        a2 && i2 && (n2.deferred || setInputSelection(a2, e3, t3), null !== f.selectionDeferId && cancelDefer(f.selectionDeferId), f.selectionDeferId = defer(function() {
          f.selectionDeferId = null, setInputSelection(a2, e3, t3);
        }), f.previousSelection = { start: e3, end: t3, length: Math.abs(t3 - e3) });
      }, f.getSelection = function() {
        return getInputSelection(f.getInputDOMNode());
      }, f.getCursorPosition = function() {
        return f.getSelection().start;
      }, f.setCursorPosition = function(e3) {
        f.setSelection(e3, e3);
      }, f.isFocused = function() {
        return f.focused;
      }, f.getBeforeMaskedValueChangeConfig = function() {
        var e3 = f.maskOptions, t3 = e3.mask, n2 = e3.maskChar, a2 = e3.permanents, i2 = e3.formatChars;
        return { mask: t3, maskChar: n2, permanents: a2, alwaysShowMask: !!f.props.alwaysShowMask, formatChars: i2 };
      }, f.isInputAutofilled = function(e3, t3, n2, a2) {
        var i2 = f.getInputDOMNode();
        try {
          if (i2.matches(":-webkit-autofill")) return true;
        } catch (r2) {
        }
        return !f.focused || a2.end < n2.length && t3.end === e3.length;
      }, f.onChange = function(e3) {
        var t3 = _assertThisInitialized(_assertThisInitialized(f)).beforePasteState, n2 = _assertThisInitialized(_assertThisInitialized(f)).previousSelection, a2 = f.props.beforeMaskedValueChange, i2 = f.getInputValue(), r2 = f.value, o2 = f.getSelection();
        f.isInputAutofilled(i2, o2, r2, n2) && (r2 = formatValue(f.maskOptions, ""), n2 = { start: 0, end: 0, length: 0 }), t3 && (n2 = t3.selection, r2 = t3.value, o2 = { start: n2.start + i2.length, end: n2.start + i2.length, length: 0 }, i2 = r2.slice(0, n2.start) + i2 + r2.slice(n2.end), f.beforePasteState = null);
        var s2 = processChange(f.maskOptions, i2, o2, r2, n2), l2 = s2.enteredString, u2 = s2.selection, c2 = s2.value;
        if (isFunction(a2)) {
          var h = a2({ value: c2, selection: u2 }, { value: r2, selection: n2 }, l2, f.getBeforeMaskedValueChangeConfig());
          c2 = h.value, u2 = h.selection;
        }
        f.setInputValue(c2), isFunction(f.props.onChange) && f.props.onChange(e3), f.isWindowsPhoneBrowser ? f.setSelection(u2.start, u2.end, { deferred: true }) : f.setSelection(u2.start, u2.end);
      }, f.onFocus = function(e3) {
        var t3 = f.props.beforeMaskedValueChange, n2 = f.maskOptions, a2 = n2.mask, i2 = n2.prefix;
        if (f.focused = true, f.mounted = true, a2) {
          if (f.value) getFilledLength(f.maskOptions, f.value) < f.maskOptions.mask.length && f.setCursorToEnd();
          else {
            var r2 = formatValue(f.maskOptions, i2), o2 = formatValue(f.maskOptions, r2), s2 = getFilledLength(f.maskOptions, o2), l2 = getRightEditablePosition(f.maskOptions, s2), u2 = { start: l2, end: l2 };
            if (isFunction(t3)) {
              var c2 = t3({ value: o2, selection: u2 }, { value: f.value, selection: null }, null, f.getBeforeMaskedValueChangeConfig());
              o2 = c2.value, u2 = c2.selection;
            }
            var h = o2 !== f.getInputValue();
            h && f.setInputValue(o2), h && isFunction(f.props.onChange) && f.props.onChange(e3), f.setSelection(u2.start, u2.end);
          }
          f.runSaveSelectionLoop();
        }
        isFunction(f.props.onFocus) && f.props.onFocus(e3);
      }, f.onBlur = function(e3) {
        var t3 = f.props.beforeMaskedValueChange, n2 = f.maskOptions.mask;
        if (f.stopSaveSelectionLoop(), f.focused = false, n2 && !f.props.alwaysShowMask && isEmpty(f.maskOptions, f.value)) {
          var a2 = "";
          if (isFunction(t3)) a2 = t3({ value: a2, selection: null }, { value: f.value, selection: f.previousSelection }, null, f.getBeforeMaskedValueChangeConfig()).value;
          var i2 = a2 !== f.getInputValue();
          i2 && f.setInputValue(a2), i2 && isFunction(f.props.onChange) && f.props.onChange(e3);
        }
        isFunction(f.props.onBlur) && f.props.onBlur(e3);
      }, f.onMouseDown = function(e3) {
        if (!f.focused && document.addEventListener) {
          f.mouseDownX = e3.clientX, f.mouseDownY = e3.clientY, f.mouseDownTime = (/* @__PURE__ */ new Date()).getTime();
          var r2 = function r3(e4) {
            if (document.removeEventListener("mouseup", r3), f.focused) {
              var t3 = Math.abs(e4.clientX - f.mouseDownX), n2 = Math.abs(e4.clientY - f.mouseDownY), a2 = Math.max(t3, n2), i2 = (/* @__PURE__ */ new Date()).getTime() - f.mouseDownTime;
              (a2 <= 10 && i2 <= 200 || a2 <= 5 && i2 <= 300) && f.setCursorToEnd();
            }
          };
          document.addEventListener("mouseup", r2);
        }
        isFunction(f.props.onMouseDown) && f.props.onMouseDown(e3);
      }, f.onPaste = function(e3) {
        isFunction(f.props.onPaste) && f.props.onPaste(e3), e3.defaultPrevented || (f.beforePasteState = { value: f.getInputValue(), selection: f.getSelection() }, f.setInputValue(""));
      }, f.handleRef = function(e3) {
        null == f.props.children && isFunction(f.props.inputRef) && f.props.inputRef(e3);
      };
      var t2 = e2.mask, n = e2.maskChar, a = e2.formatChars, i = e2.alwaysShowMask, r = e2.beforeMaskedValueChange, o = e2.defaultValue, s = e2.value;
      f.maskOptions = parseMask(t2, n, a), null == o && (o = ""), null == s && (s = o);
      var l = getStringValue(s);
      if (f.maskOptions.mask && (i || l) && (l = formatValue(f.maskOptions, l), isFunction(r))) {
        var u = e2.value;
        null == e2.value && (u = o), l = r({ value: l, selection: null }, { value: u = getStringValue(u), selection: null }, null, f.getBeforeMaskedValueChangeConfig()).value;
      }
      return f.value = l, f;
    }
    _inheritsLoose(e, c);
    var t = e.prototype;
    return t.componentDidMount = function() {
      this.mounted = true, this.getInputDOMNode() && (this.isWindowsPhoneBrowser = isWindowsPhoneBrowser(), this.maskOptions.mask && this.getInputValue() !== this.value && this.setInputValue(this.value));
    }, t.componentDidUpdate = function() {
      var e2 = this.previousSelection, t2 = this.props, n = t2.beforeMaskedValueChange, a = t2.alwaysShowMask, i = t2.mask, r = t2.maskChar, o = t2.formatChars, s = this.maskOptions, l = a || this.isFocused(), u = null != this.props.value, c2 = u ? getStringValue(this.props.value) : this.value, h = e2 ? e2.start : null;
      if (this.maskOptions = parseMask(i, r, o), this.maskOptions.mask) {
        !s.mask && this.isFocused() && this.runSaveSelectionLoop();
        var f = this.maskOptions.mask && this.maskOptions.mask !== s.mask;
        if (s.mask || u || (c2 = this.getInputValue()), (f || this.maskOptions.mask && (c2 || l)) && (c2 = formatValue(this.maskOptions, c2)), f) {
          var p = getFilledLength(this.maskOptions, c2);
          (null === h || p < h) && (h = isFilled(this.maskOptions, c2) ? p : getRightEditablePosition(this.maskOptions, p));
        }
        !this.maskOptions.mask || !isEmpty(this.maskOptions, c2) || l || u && this.props.value || (c2 = "");
        var d = { start: h, end: h };
        if (isFunction(n)) {
          var m = n({ value: c2, selection: d }, { value: this.value, selection: this.previousSelection }, null, this.getBeforeMaskedValueChangeConfig());
          c2 = m.value, d = m.selection;
        }
        this.value = c2;
        var g = this.getInputValue() !== this.value;
        g ? (this.setInputValue(this.value), this.forceUpdate()) : f && this.forceUpdate();
        var v = false;
        null != d.start && null != d.end && (v = !e2 || e2.start !== d.start || e2.end !== d.end), (v || g) && this.setSelection(d.start, d.end);
      } else s.mask && (this.stopSaveSelectionLoop(), this.forceUpdate());
    }, t.componentWillUnmount = function() {
      this.mounted = false, null !== this.selectionDeferId && cancelDefer(this.selectionDeferId), this.stopSaveSelectionLoop();
    }, t.render = function() {
      var t2, e2 = this.props, n = (e2.mask, e2.alwaysShowMask, e2.maskChar, e2.formatChars, e2.inputRef, e2.beforeMaskedValueChange, e2.children), a = _objectWithoutPropertiesLoose(e2, ["mask", "alwaysShowMask", "maskChar", "formatChars", "inputRef", "beforeMaskedValueChange", "children"]);
      if (n) {
        isFunction(n) || invariant_1(false);
        var i = ["onChange", "onPaste", "onMouseDown", "onFocus", "onBlur", "value", "disabled", "readOnly"], r = _extends({}, a);
        i.forEach(function(e3) {
          return delete r[e3];
        }), t2 = n(r), i.filter(function(e3) {
          return null != t2.props[e3] && t2.props[e3] !== a[e3];
        }).length && invariant_1(false);
      } else t2 = React.createElement("input", _extends({ ref: this.handleRef }, a));
      var o = { onFocus: this.onFocus, onBlur: this.onBlur };
      return this.maskOptions.mask && (a.disabled || a.readOnly || (o.onChange = this.onChange, o.onPaste = this.onPaste, o.onMouseDown = this.onMouseDown), null != a.value && (o.value = this.value)), t2 = React.cloneElement(t2, o);
    }, e;
  })(React.Component);
  reactInputMask_production_min = InputElement;
  return reactInputMask_production_min;
}
var hasRequiredReactInputMask;
function requireReactInputMask() {
  if (hasRequiredReactInputMask) return reactInputMask.exports;
  hasRequiredReactInputMask = 1;
  {
    reactInputMask.exports = requireReactInputMask_production_min();
  }
  return reactInputMask.exports;
}
var reactInputMaskExports = requireReactInputMask();
const index = /* @__PURE__ */ getDefaultExportFromCjs(reactInputMaskExports);
const index$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: index
}, [reactInputMaskExports]);
export {
  index$1 as i
};
//# sourceMappingURL=index-m9GSA7An.js.map
