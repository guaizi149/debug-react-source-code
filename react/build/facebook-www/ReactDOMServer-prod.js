'use strict';

var React = require('react');

// Do not require this module directly! Use normal `invariant` calls with
// template literal strings. The messages will be replaced with error codes
// during build.
function formatProdErrorMessage(code) {
  let url = 'https://reactjs.org/docs/error-decoder.html?invariant=' + code;

  for (let i = 1; i < arguments.length; i++) {
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }

  return "Minified React error #" + code + "; visit " + url + " for the full message or " + 'use the non-minified dev environment for full errors and additional ' + 'helpful warnings.';
}

function beginWriting(destination) {}
function writeChunk(destination, chunk) {
  destination.buffer += chunk;
  return true;
}
function completeWriting(destination) {}
function close(destination) {
  destination.done = true;
}
function stringToChunk(content) {
  return content;
}
function stringToPrecomputedChunk(content) {
  return content;
}
function closeWithError(destination, error) {
  destination.done = true;
  destination.fatal = true;
  destination.error = error;
}

// Re-export dynamic flags from the www version.
const dynamicFeatureFlags = require('ReactFeatureFlags');

const disableInputAttributeSyncing = dynamicFeatureFlags.disableInputAttributeSyncing,
      enableTrustedTypesIntegration = dynamicFeatureFlags.enableTrustedTypesIntegration,
      disableSchedulerTimeoutBasedOnReactExpirationTime = dynamicFeatureFlags.disableSchedulerTimeoutBasedOnReactExpirationTime,
      warnAboutSpreadingKeyToJSX = dynamicFeatureFlags.warnAboutSpreadingKeyToJSX,
      replayFailedUnitOfWorkWithInvokeGuardedCallback = dynamicFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback,
      enableFilterEmptyStringAttributesDOM = dynamicFeatureFlags.enableFilterEmptyStringAttributesDOM,
      enableLegacyFBSupport = dynamicFeatureFlags.enableLegacyFBSupport,
      deferRenderPhaseUpdateToNextBatch = dynamicFeatureFlags.deferRenderPhaseUpdateToNextBatch,
      enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
      skipUnmountedBoundaries = dynamicFeatureFlags.skipUnmountedBoundaries,
      createRootStrictEffectsByDefault = dynamicFeatureFlags.createRootStrictEffectsByDefault,
      enableUseRefAccessWarning = dynamicFeatureFlags.enableUseRefAccessWarning,
      disableNativeComponentFrames = dynamicFeatureFlags.disableNativeComponentFrames,
      disableSchedulerTimeoutInWorkLoop = dynamicFeatureFlags.disableSchedulerTimeoutInWorkLoop,
      enableLazyContextPropagation = dynamicFeatureFlags.enableLazyContextPropagation,
      enableSyncDefaultUpdates = dynamicFeatureFlags.enableSyncDefaultUpdates,
      warnOnSubscriptionInsideStartTransition = dynamicFeatureFlags.warnOnSubscriptionInsideStartTransition; // On WWW, true is used for a new modern build.

const hasOwnProperty = Object.prototype.hasOwnProperty;

// A reserved attribute.
// It is handled by React separately and shouldn't be written to the DOM.
const RESERVED = 0; // A simple string attribute.
// Attributes that aren't in the filter are presumed to have this type.

const STRING = 1; // A string attribute that accepts booleans in React. In HTML, these are called
// "enumerated" attributes with "true" and "false" as possible values.
// When true, it should be set to a "true" string.
// When false, it should be set to a "false" string.

const BOOLEANISH_STRING = 2; // A real boolean attribute.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.

const BOOLEAN = 3; // An attribute that can be used as a flag as well as with a value.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.
// For any other value, should be present with that value.

const OVERLOADED_BOOLEAN = 4; // An attribute that must be numeric or parse as a numeric.
// When falsy, it should be removed.

const NUMERIC = 5; // An attribute that must be positive numeric or parse as a positive numeric.
// When falsy, it should be removed.

const POSITIVE_NUMERIC = 6;

/* eslint-disable max-len */
const ATTRIBUTE_NAME_START_CHAR = ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */

const ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
const VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
const illegalAttributeNameCache = {};
const validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
  if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
    return true;
  }

  if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
    return false;
  }

  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }

  illegalAttributeNameCache[attributeName] = true;

  return false;
}
function getPropertyInfo(name) {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL, removeEmptyString) {
  this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
  this.sanitizeURL = sanitizeURL;
  this.removeEmptyString = removeEmptyString;
} // When adding attributes to this list, be sure to also add them to
// the `possibleStandardNames` module to ensure casing and incorrect
// name warnings.


const properties = {}; // These props are reserved by React. They shouldn't be written to the DOM.

const reservedProps = ['children', 'dangerouslySetInnerHTML', // TODO: This prevents the assignment of defaultValue to regular
// elements (not just inputs). Now that ReactDOMInput assigns to the
// defaultValue property -- do we need this?
'defaultValue', 'defaultChecked', 'innerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style'];
reservedProps.forEach(name => {
  properties[name] = new PropertyInfoRecord(name, RESERVED, false, // mustUseProperty
  name, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // A few React string attributes have a different name.
// This is a mapping from React prop names to the attribute names.

[['acceptCharset', 'accept-charset'], ['className', 'class'], ['htmlFor', 'for'], ['httpEquiv', 'http-equiv']].forEach((_ref) => {
  let name = _ref[0],
      attributeName = _ref[1];
  properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
  attributeName, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are "enumerated" HTML attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).

['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
  name.toLowerCase(), // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are "enumerated" SVG attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
// Since these are SVG attributes, their attribute names are case-sensitive.

['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
  name, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are HTML boolean attributes.

['allowFullScreen', 'async', // Note: there is a special case that prevents it from being written to the DOM
// on the client side because the browsers are inconsistent. Instead we call focus().
'autoFocus', 'autoPlay', 'controls', 'default', 'defer', 'disabled', 'disablePictureInPicture', 'disableRemotePlayback', 'formNoValidate', 'hidden', 'loop', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly', 'required', 'reversed', 'scoped', 'seamless', // Microdata
'itemScope'].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, BOOLEAN, false, // mustUseProperty
  name.toLowerCase(), // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are the few React props that we set as DOM properties
// rather than attributes. These are all booleans.

['checked', // Note: `option.selected` is not updated if `select.multiple` is
// disabled with `removeAttribute`. We have special logic for handling this.
'multiple', 'muted', 'selected' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, BOOLEAN, true, // mustUseProperty
  name, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are HTML attributes that are "overloaded booleans": they behave like
// booleans, but can also accept a string value.

['capture', 'download' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, OVERLOADED_BOOLEAN, false, // mustUseProperty
  name, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are HTML attributes that must be positive numbers.

['cols', 'rows', 'size', 'span' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, POSITIVE_NUMERIC, false, // mustUseProperty
  name, // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These are HTML attributes that must be numbers.

['rowSpan', 'start'].forEach(name => {
  properties[name] = new PropertyInfoRecord(name, NUMERIC, false, // mustUseProperty
  name.toLowerCase(), // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
});
const CAMELIZE = /[\-\:]([a-z])/g;

const capitalize = token => token[1].toUpperCase(); // This is a list of all SVG attributes that need special casing, namespacing,
// or boolean value assignment. Regular attributes that just accept strings
// and have the same names are omitted, just like in the HTML attribute filter.
// Some of these attributes can be hard to find. This list was created by
// scraping the MDN documentation.


['accent-height', 'alignment-baseline', 'arabic-form', 'baseline-shift', 'cap-height', 'clip-path', 'clip-rule', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'dominant-baseline', 'enable-background', 'fill-opacity', 'fill-rule', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-name', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'horiz-adv-x', 'horiz-origin-x', 'image-rendering', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'overline-position', 'overline-thickness', 'paint-order', 'panose-1', 'pointer-events', 'rendering-intent', 'shape-rendering', 'stop-color', 'stop-opacity', 'strikethrough-position', 'strikethrough-thickness', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'underline-position', 'underline-thickness', 'unicode-bidi', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'vector-effect', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'word-spacing', 'writing-mode', 'xmlns:xlink', 'x-height' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
  attributeName, null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // String SVG attributes with the xlink namespace.

['xlink:actuate', 'xlink:arcrole', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
  attributeName, 'http://www.w3.org/1999/xlink', false, // sanitizeURL
  false);
}); // String SVG attributes with the xml namespace.

['xml:base', 'xml:lang', 'xml:space' // NOTE: if you add a camelCased prop to this list,
// you'll need to set attributeName to name.toLowerCase()
// instead in the assignment below.
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
  attributeName, 'http://www.w3.org/XML/1998/namespace', false, // sanitizeURL
  false);
}); // These attribute exists both in HTML and SVG.
// The attribute name is case-sensitive in SVG so we can't just use
// the React name like we do for attributes that exist only in HTML.

['tabIndex', 'crossOrigin'].forEach(attributeName => {
  properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
  attributeName.toLowerCase(), // attributeName
  null, // attributeNamespace
  false, // sanitizeURL
  false);
}); // These attributes accept URLs. These must not allow javascript: URLS.
// These will also need to accept Trusted Types object in the future.

const xlinkHref = 'xlinkHref';
properties[xlinkHref] = new PropertyInfoRecord('xlinkHref', STRING, false, // mustUseProperty
'xlink:href', 'http://www.w3.org/1999/xlink', true, // sanitizeURL
false);
['src', 'href', 'action', 'formAction'].forEach(attributeName => {
  properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
  attributeName.toLowerCase(), // attributeName
  null, // attributeNamespace
  true, // sanitizeURL
  true);
});

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
const isUnitlessNumber = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
};
/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */

function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}
/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */


const prefixes = ['Webkit', 'ms', 'Moz', 'O']; // Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.

Object.keys(isUnitlessNumber).forEach(function (prop) {
  prefixes.forEach(function (prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

// code copied and modified from escape-html

/**
 * Module variables.
 * @private
 */
const matchHtmlRegExp = /["'&<>]/;
/**
 * Escapes special characters and HTML entities in a given html string.
 *
 * @param  {string} string HTML string to escape for later insertion
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  const str = '' + string;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape;
  let html = '';
  let index;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        // "
        escape = '&quot;';
        break;

      case 38:
        // &
        escape = '&amp;';
        break;

      case 39:
        // '
        escape = '&#x27;'; // modified from escape-html; used to be '&#39'

        break;

      case 60:
        // <
        escape = '&lt;';
        break;

      case 62:
        // >
        escape = '&gt;';
        break;

      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
} // end code copied and modified from escape-html

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */


function escapeTextForBrowser(text) {
  if (typeof text === 'boolean' || typeof text === 'number') {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return '' + text;
  }

  return escapeHtml(text);
}

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 */

function hyphenateStyleName(name) {
  return name.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
}

// and any newline or tab are filtered out as if they're not part of the URL.
// https://url.spec.whatwg.org/#url-parsing
// Tab or newline are defined as \r\n\t:
// https://infra.spec.whatwg.org/#ascii-tab-or-newline
// A C0 control is a code point in the range \u0000 NULL to \u001F
// INFORMATION SEPARATOR ONE, inclusive:
// https://infra.spec.whatwg.org/#c0-control-or-space

/* eslint-disable max-len */

const isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

function sanitizeURL(url) {
  {
    if (!!isJavaScriptProtocol.test(url)) {
      {
        throw Error( formatProdErrorMessage(323));
      }
    }
  }
}

const isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

// Allows us to keep track of what we've already written so we can refer back to it.
function createResponseState(identifierPrefix) {
  const idPrefix = identifierPrefix === undefined ? '' : identifierPrefix;
  return {
    placeholderPrefix: stringToPrecomputedChunk(idPrefix + 'P:'),
    segmentPrefix: stringToPrecomputedChunk(idPrefix + 'S:'),
    boundaryPrefix: idPrefix + 'B:',
    opaqueIdentifierPrefix: idPrefix + 'R:',
    nextSuspenseID: 0,
    nextOpaqueID: 0,
    sentCompleteSegmentFunction: false,
    sentCompleteBoundaryFunction: false,
    sentClientRenderFunction: false
  };
} // Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.

const ROOT_HTML_MODE = 0; // Used for the root most element tag.

const HTML_MODE = 1;
const SVG_MODE = 2;
const MATHML_MODE = 3;
const HTML_TABLE_MODE = 4;
const HTML_TABLE_BODY_MODE = 5;
const HTML_TABLE_ROW_MODE = 6;
const HTML_COLGROUP_MODE = 7; // We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense

function createFormatContext(insertionMode, selectedValue) {
  return {
    insertionMode,
    selectedValue
  };
}

function createRootFormatContext(namespaceURI) {
  const insertionMode = namespaceURI === 'http://www.w3.org/2000/svg' ? SVG_MODE : namespaceURI === 'http://www.w3.org/1998/Math/MathML' ? MATHML_MODE : ROOT_HTML_MODE;
  return createFormatContext(insertionMode, null);
}
function getChildFormatContext(parentContext, type, props) {
  switch (type) {
    case 'select':
      return createFormatContext(HTML_MODE, props.value != null ? props.value : props.defaultValue);

    case 'svg':
      return createFormatContext(SVG_MODE, null);

    case 'math':
      return createFormatContext(MATHML_MODE, null);

    case 'foreignObject':
      return createFormatContext(HTML_MODE, null);
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.

    case 'table':
      return createFormatContext(HTML_TABLE_MODE, null);

    case 'thead':
    case 'tbody':
    case 'tfoot':
      return createFormatContext(HTML_TABLE_BODY_MODE, null);

    case 'colgroup':
      return createFormatContext(HTML_COLGROUP_MODE, null);

    case 'tr':
      return createFormatContext(HTML_TABLE_ROW_MODE, null);
  }

  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(HTML_MODE, null);
  }

  if (parentContext.insertionMode === ROOT_HTML_MODE) {
    // We've emitted the root and is now in plain HTML mode.
    return createFormatContext(HTML_MODE, null);
  }

  return parentContext;
} // This object is used to lazily reuse the ID of the first generated node, or assign one.
// We can't assign an ID up front because the node we're attaching it to might already
// have one. So we need to lazily use that if it's available.

function createSuspenseBoundaryID(responseState) {
  return {
    formattedID: null
  };
}
function makeServerID(responseState) {
  if (!(responseState !== null)) {
    {
      throw Error( formatProdErrorMessage(404));
    }
  } // TODO: This is not deterministic since it's created during render.


  return responseState.opaqueIdentifierPrefix + (responseState.nextOpaqueID++).toString(36);
}

function encodeHTMLTextNode(text) {
  return escapeTextForBrowser(text);
}

function assignAnID(responseState, id) {
  // TODO: This approach doesn't yield deterministic results since this is assigned during render.
  const generatedID = responseState.nextSuspenseID++;
  return id.formattedID = stringToPrecomputedChunk(responseState.boundaryPrefix + generatedID.toString(16));
}

const dummyNode1 = stringToPrecomputedChunk('<template id="');
const dummyNode2 = stringToPrecomputedChunk('"></template>');

function pushDummyNodeWithID(target, responseState, assignID) {
  const id = assignAnID(responseState, assignID);
  target.push(dummyNode1, id, dummyNode2);
}

function pushEmpty(target, responseState, assignID) {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }
}
const textSeparator = stringToPrecomputedChunk('<!-- -->');
function pushTextInstance(target, text, responseState, assignID) {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }

  if (text === '') {
    // Empty text doesn't have a DOM node representation and the hydration is aware of this.
    return;
  } // TODO: Avoid adding a text separator in common cases.


  target.push(stringToChunk(encodeHTMLTextNode(text)), textSeparator);
}
const styleNameCache = new Map();

function processStyleName(styleName) {
  const chunk = styleNameCache.get(styleName);

  if (chunk !== undefined) {
    return chunk;
  }

  const result = stringToPrecomputedChunk(escapeTextForBrowser(hyphenateStyleName(styleName)));
  styleNameCache.set(styleName, result);
  return result;
}

const styleAttributeStart = stringToPrecomputedChunk(' style="');
const styleAssign = stringToPrecomputedChunk(':');
const styleSeparator = stringToPrecomputedChunk(';');

function pushStyle(target, responseState, style) {
  if (!(typeof style === 'object')) {
    {
      throw Error( formatProdErrorMessage(62));
    }
  }

  let isFirst = true;

  for (const styleName in style) {
    if (!hasOwnProperty.call(style, styleName)) {
      continue;
    } // If you provide unsafe user data here they can inject arbitrary CSS
    // which may be problematic (I couldn't repro this):
    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
    // This is not an XSS hole but instead a potential CSS injection issue
    // which has lead to a greater discussion about how we're going to
    // trust URLs moving forward. See #2115901


    const styleValue = style[styleName];

    if (styleValue == null || typeof styleValue === 'boolean' || styleValue === '') {
      // TODO: We used to set empty string as a style with an empty value. Does that ever make sense?
      continue;
    }

    let nameChunk;
    let valueChunk;
    const isCustomProperty = styleName.indexOf('--') === 0;

    if (isCustomProperty) {
      nameChunk = stringToChunk(escapeTextForBrowser(styleName));
      valueChunk = stringToChunk(escapeTextForBrowser(('' + styleValue).trim()));
    } else {

      nameChunk = processStyleName(styleName);

      if (typeof styleValue === 'number') {
        if (styleValue !== 0 && !hasOwnProperty.call(isUnitlessNumber, styleName)) {
          valueChunk = stringToChunk(styleValue + 'px'); // Presumes implicit 'px' suffix for unitless numbers
        } else {
          valueChunk = stringToChunk('' + styleValue);
        }
      } else {
        valueChunk = stringToChunk(escapeTextForBrowser(('' + styleValue).trim()));
      }
    }

    if (isFirst) {
      isFirst = false; // If it's first, we don't need any separators prefixed.

      target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
    } else {
      target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
    }
  }

  if (!isFirst) {
    target.push(attributeEnd);
  }
}

const attributeSeparator = stringToPrecomputedChunk(' ');
const attributeAssign = stringToPrecomputedChunk('="');
const attributeEnd = stringToPrecomputedChunk('"');
const attributeEmptyString = stringToPrecomputedChunk('=""');

function pushAttribute(target, responseState, name, value) {
  switch (name) {
    case 'style':
      {
        pushStyle(target, responseState, value);
        return;
      }

    case 'defaultValue':
    case 'defaultChecked': // These shouldn't be set as attributes on generic HTML elements.

    case 'innerHTML': // Must use dangerouslySetInnerHTML instead.

    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
      // Ignored. These are built-in to React on the client.
      return;
  }

  if ( // shouldIgnoreAttribute
  // We have already filtered out null/undefined and reserved words.
  name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
    return;
  }

  const propertyInfo = getPropertyInfo(name);

  if (propertyInfo !== null) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case 'function': // $FlowIssue symbol is perfectly valid here

      case 'symbol':
        // eslint-disable-line
        return;

      case 'boolean':
        {
          if (!propertyInfo.acceptsBooleans) {
            return;
          }
        }
    }

    if (enableFilterEmptyStringAttributesDOM) {
      if (propertyInfo.removeEmptyString && value === '') {

        return;
      }
    }

    const attributeName = propertyInfo.attributeName;
    const attributeNameChunk = stringToChunk(attributeName); // TODO: If it's known we can cache the chunk.

    switch (propertyInfo.type) {
      case BOOLEAN:
        if (value) {
          target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
        }

        return;

      case OVERLOADED_BOOLEAN:
        if (value === true) {
          target.push(attributeSeparator, attributeNameChunk, attributeEmptyString);
        } else if (value === false) ; else {
          target.push(attributeSeparator, attributeNameChunk, attributeAssign, escapeTextForBrowser(value), attributeEnd);
        }

        return;

      case NUMERIC:
        if (!isNaN(value)) {
          target.push(attributeSeparator, attributeNameChunk, attributeAssign, escapeTextForBrowser(value), attributeEnd);
        }

        break;

      case POSITIVE_NUMERIC:
        if (!isNaN(value) && value >= 1) {
          target.push(attributeSeparator, attributeNameChunk, attributeAssign, escapeTextForBrowser(value), attributeEnd);
        }

        break;

      default:
        if (propertyInfo.sanitizeURL) {
          value = '' + value;
          sanitizeURL(value);
        }

        target.push(attributeSeparator, attributeNameChunk, attributeAssign, escapeTextForBrowser(value), attributeEnd);
    }
  } else if (isAttributeNameSafe(name)) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case 'function': // $FlowIssue symbol is perfectly valid here

      case 'symbol':
        // eslint-disable-line
        return;

      case 'boolean':
        {
          const prefix = name.toLowerCase().slice(0, 5);

          if (prefix !== 'data-' && prefix !== 'aria-') {
            return;
          }
        }
    }

    target.push(attributeSeparator, stringToChunk(name), attributeAssign, escapeTextForBrowser(value), attributeEnd);
  }
}

const endOfStartTag = stringToPrecomputedChunk('>');
const endOfStartTagSelfClosing = stringToPrecomputedChunk('/>');
const idAttr = stringToPrecomputedChunk(' id="');
const attrEnd = stringToPrecomputedChunk('"');

function pushID(target, responseState, assignID, existingID) {
  if (existingID !== null && existingID !== undefined && (typeof existingID === 'string' || typeof existingID === 'object')) {
    // We can reuse the existing ID for our purposes.
    assignID.formattedID = stringToPrecomputedChunk(escapeTextForBrowser(existingID));
  } else {
    const encodedID = assignAnID(responseState, assignID);
    target.push(idAttr, encodedID, attrEnd);
  }
}

function pushInnerHTML(target, innerHTML, children) {
  if (innerHTML != null) {
    if (!(children == null)) {
      {
        throw Error( formatProdErrorMessage(60));
      }
    }

    if (!(typeof innerHTML === 'object' && '__html' in innerHTML)) {
      {
        throw Error( formatProdErrorMessage(61));
      }
    }

    const html = innerHTML.__html;

    if (html !== null && html !== undefined) {
      target.push(stringToChunk('' + html));
    }
  }
} // TODO: Move these to ResponseState so that we warn for every request.

function pushStartSelect(target, props, responseState, assignID) {

  target.push(startChunkForTag('select'));
  let children = null;
  let innerHTML = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'dangerouslySetInnerHTML':
          // TODO: This doesn't really make sense for select since it can't use the controlled
          // value in the innerHTML.
          innerHTML = propValue;
          break;

        case 'defaultValue':
        case 'value':
          // These are set on the Context instead and applied to the nested options.
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function flattenOptionChildren(children) {
  let content = ''; // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.

  React.Children.forEach(children, function (child) {
    if (child == null) {
      return;
    }

    content += child;
  });
  return content;
}

const selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');

function pushStartOption(target, props, responseState, formatContext, assignID) {
  const selectedValue = formatContext.selectedValue;
  target.push(startChunkForTag('option'));
  let children = null;
  let value = null;
  let selected = null;
  let innerHTML = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'selected':
          // ignore
          selected = propValue;

          break;

        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        // eslint-disable-next-line-no-fallthrough

        case 'value':
          value = propValue;
        // We intentionally fallthrough to also set the attribute on the node.
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (selectedValue !== null) {
    let stringValue;

    if (value !== null) {
      stringValue = '' + value;
    } else {

      stringValue = flattenOptionChildren(children);
    }

    if (isArray(selectedValue)) {
      // multiple
      for (let i = 0; i < selectedValue.length; i++) {
        const v = '' + selectedValue[i];

        if (v === stringValue) {
          target.push(selectedMarkerAttribute);
          break;
        }
      }
    } else if (selectedValue === stringValue) {
      target.push(selectedMarkerAttribute);
    }
  } else if (selected) {
    target.push(selectedMarkerAttribute);
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function pushInput(target, props, responseState, assignID) {

  target.push(startChunkForTag('input'));
  let value = null;
  let defaultValue = null;
  let checked = null;
  let defaultChecked = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          {
            {
              throw Error( formatProdErrorMessage(399, 'input'));
            }
          }

        // eslint-disable-next-line-no-fallthrough

        case 'defaultChecked':
          defaultChecked = propValue;
          break;

        case 'defaultValue':
          defaultValue = propValue;
          break;

        case 'checked':
          checked = propValue;
          break;

        case 'value':
          value = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (checked !== null) {
    pushAttribute(target, responseState, 'checked', checked);
  } else if (defaultChecked !== null) {
    pushAttribute(target, responseState, 'checked', defaultChecked);
  }

  if (value !== null) {
    pushAttribute(target, responseState, 'value', value);
  } else if (defaultValue !== null) {
    pushAttribute(target, responseState, 'value', defaultValue);
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartTextArea(target, props, responseState, assignID) {

  target.push(startChunkForTag('textarea'));
  let value = null;
  let defaultValue = null;
  let children = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'value':
          value = propValue;
          break;

        case 'defaultValue':
          defaultValue = propValue;
          break;

        case 'dangerouslySetInnerHTML':
          {
            {
              throw Error( formatProdErrorMessage(91));
            }
          }

        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (value === null && defaultValue !== null) {
    value = defaultValue;
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag); // TODO (yungsters): Remove support for children content in <textarea>.

  if (children != null) {

    if (!(value == null)) {
      {
        throw Error( formatProdErrorMessage(92));
      }
    }

    if (isArray(children)) {
      if (!(children.length <= 1)) {
        {
          throw Error( formatProdErrorMessage(93));
        }
      }

      value = '' + children[0];
    }

    value = '' + children;
  }

  if (typeof value === 'string' && value[0] === '\n') {
    // text/html ignores the first character in these tags if it's a newline
    // Prefer to break application/xml over text/html (for now) by adding
    // a newline specifically to get eaten by the parser. (Alternately for
    // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
    // \r is normalized out by HTMLTextAreaElement#value.)
    // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
    // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
    // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
    // See: Parsing of "textarea" "listing" and "pre" elements
    //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
    target.push(leadingNewline);
  }

  return value;
}

function pushSelfClosing(target, props, tag, responseState, assignID) {
  target.push(startChunkForTag(tag));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          {
            {
              throw Error( formatProdErrorMessage(399, tag));
            }
          }

        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartMenuItem(target, props, responseState, assignID) {
  target.push(startChunkForTag('menuitem'));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          {
            {
              throw Error( formatProdErrorMessage(400));
            }
          }

        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  return null;
}

function pushStartGenericElement(target, props, tag, responseState, assignID) {
  target.push(startChunkForTag(tag));
  let children = null;
  let innerHTML = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);

  if (typeof children === 'string') {
    // Special case children as a string to avoid the unnecessary comment.
    // TODO: Remove this special case after the general optimization is in place.
    target.push(stringToChunk(encodeHTMLTextNode(children)));
    return null;
  }

  return children;
}

function pushStartCustomElement(target, props, tag, responseState, assignID) {
  target.push(startChunkForTag(tag));
  let children = null;
  let innerHTML = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;

        case 'style':
          pushStyle(target, responseState, propValue);
          break;

        case 'suppressContentEditableWarning':
        case 'suppressHydrationWarning':
          // Ignored. These are built-in to React on the client.
          break;

        default:
          if (isAttributeNameSafe(propKey) && typeof propValue !== 'function' && typeof propValue !== 'symbol') {
            target.push(attributeSeparator, stringToChunk(propKey), attributeAssign, escapeTextForBrowser(propValue), attributeEnd);
          }

          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

const leadingNewline = stringToPrecomputedChunk('\n');

function pushStartPreformattedElement(target, props, tag, responseState, assignID) {
  target.push(startChunkForTag(tag));
  let children = null;
  let innerHTML = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case 'children':
          children = propValue;
          break;

        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag); // text/html ignores the first character in these tags if it's a newline
  // Prefer to break application/xml over text/html (for now) by adding
  // a newline specifically to get eaten by the parser. (Alternately for
  // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
  // \r is normalized out by HTMLTextAreaElement#value.)
  // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
  // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
  // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
  // See: Parsing of "textarea" "listing" and "pre" elements
  //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
  // TODO: This doesn't deal with the case where the child is an array
  // or component that returns a string.

  if (innerHTML != null) {
    if (!(children == null)) {
      {
        throw Error( formatProdErrorMessage(60));
      }
    }

    if (!(typeof innerHTML === 'object' && '__html' in innerHTML)) {
      {
        throw Error( formatProdErrorMessage(61));
      }
    }

    const html = innerHTML.__html;

    if (html !== null && html !== undefined) {
      if (typeof html === 'string' && html.length > 0 && html[0] === '\n') {
        target.push(leadingNewline, stringToChunk(html));
      } else {
        target.push(stringToChunk('' + html));
      }
    }
  }

  if (typeof children === 'string' && children[0] === '\n') {
    target.push(leadingNewline);
  }

  return children;
} // We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name


const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset

const validatedTagCache = new Map();

function startChunkForTag(tag) {
  let tagStartChunk = validatedTagCache.get(tag);

  if (tagStartChunk === undefined) {
    if (!VALID_TAG_REGEX.test(tag)) {
      {
        throw Error( formatProdErrorMessage(65, tag));
      }
    }

    tagStartChunk = stringToPrecomputedChunk('<' + tag);
    validatedTagCache.set(tag, tagStartChunk);
  }

  return tagStartChunk;
}

const DOCTYPE = stringToPrecomputedChunk('<!DOCTYPE html>');
function pushStartInstance(target, type, props, responseState, formatContext, assignID) {

  switch (type) {
    // Special tags
    case 'select':
      return pushStartSelect(target, props, responseState, assignID);

    case 'option':
      return pushStartOption(target, props, responseState, formatContext, assignID);

    case 'textarea':
      return pushStartTextArea(target, props, responseState, assignID);

    case 'input':
      return pushInput(target, props, responseState, assignID);

    case 'menuitem':
      return pushStartMenuItem(target, props, responseState, assignID);
    // Newline eating tags

    case 'listing':
    case 'pre':
      {
        return pushStartPreformattedElement(target, props, type, responseState, assignID);
      }
    // Omitted close tags

    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'keygen':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
      {
        return pushSelfClosing(target, props, type, responseState, assignID);
      }
    // These are reserved SVG and MathML elements, that are never custom elements.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts

    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      {
        return pushStartGenericElement(target, props, type, responseState, assignID);
      }

    case 'html':
      {
        if (formatContext.insertionMode === ROOT_HTML_MODE) {
          // If we're rendering the html tag and we're at the root (i.e. not in foreignObject)
          // then we also emit the DOCTYPE as part of the root content as a convenience for
          // rendering the whole document.
          target.push(DOCTYPE);
        }

        return pushStartGenericElement(target, props, type, responseState, assignID);
      }

    default:
      {
        if (type.indexOf('-') === -1 && typeof props.is !== 'string') {
          // Generic element
          return pushStartGenericElement(target, props, type, responseState, assignID);
        } else {
          // Custom element
          return pushStartCustomElement(target, props, type, responseState, assignID);
        }
      }
  }
}
const endTag1 = stringToPrecomputedChunk('</');
const endTag2 = stringToPrecomputedChunk('>');
function pushEndInstance(target, type, props) {
  switch (type) {
    // Omitted close tags
    // TODO: Instead of repeating this switch we could try to pass a flag from above.
    // That would require returning a tuple. Which might be ok if it gets inlined.
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'input':
    case 'keygen':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
      {
        // No close tag needed.
        break;
      }

    default:
      {
        target.push(endTag1, stringToChunk(type), endTag2);
      }
  }
} // Structural Nodes
// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users. We use the template tag because it can be used in every
// type of parent. <script> tags also work in every other tag except <colgroup>.

const placeholder1 = stringToPrecomputedChunk('<template id="');
const placeholder2 = stringToPrecomputedChunk('"></template>');
function writePlaceholder(destination, responseState, id) {
  writeChunk(destination, placeholder1);
  writeChunk(destination, responseState.placeholderPrefix);
  const formattedID = stringToChunk(id.toString(16));
  writeChunk(destination, formattedID);
  return writeChunk(destination, placeholder2);
} // Suspense boundaries are encoded as comments.

const startCompletedSuspenseBoundary = stringToPrecomputedChunk('<!--$-->');
const startPendingSuspenseBoundary = stringToPrecomputedChunk('<!--$?-->');
const startClientRenderedSuspenseBoundary = stringToPrecomputedChunk('<!--$!-->');
const endSuspenseBoundary = stringToPrecomputedChunk('<!--/$-->');
function writeStartCompletedSuspenseBoundary(destination, responseState, id) {
  return writeChunk(destination, startCompletedSuspenseBoundary);
}
function writeStartPendingSuspenseBoundary(destination, responseState, id) {
  return writeChunk(destination, startPendingSuspenseBoundary);
}
function writeStartClientRenderedSuspenseBoundary(destination, responseState, id) {
  return writeChunk(destination, startClientRenderedSuspenseBoundary);
}
function writeEndCompletedSuspenseBoundary(destination, responseState) {
  return writeChunk(destination, endSuspenseBoundary);
}
function writeEndPendingSuspenseBoundary(destination, responseState) {
  return writeChunk(destination, endSuspenseBoundary);
}
function writeEndClientRenderedSuspenseBoundary(destination, responseState) {
  return writeChunk(destination, endSuspenseBoundary);
}
const startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
const startSegmentHTML2 = stringToPrecomputedChunk('">');
const endSegmentHTML = stringToPrecomputedChunk('</div>');
const startSegmentSVG = stringToPrecomputedChunk('<svg aria-hidden="true" style="display:none" id="');
const startSegmentSVG2 = stringToPrecomputedChunk('">');
const endSegmentSVG = stringToPrecomputedChunk('</svg>');
const startSegmentMathML = stringToPrecomputedChunk('<math aria-hidden="true" style="display:none" id="');
const startSegmentMathML2 = stringToPrecomputedChunk('">');
const endSegmentMathML = stringToPrecomputedChunk('</math>');
const startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
const startSegmentTable2 = stringToPrecomputedChunk('">');
const endSegmentTable = stringToPrecomputedChunk('</table>');
const startSegmentTableBody = stringToPrecomputedChunk('<table hidden><tbody id="');
const startSegmentTableBody2 = stringToPrecomputedChunk('">');
const endSegmentTableBody = stringToPrecomputedChunk('</tbody></table>');
const startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
const startSegmentTableRow2 = stringToPrecomputedChunk('">');
const endSegmentTableRow = stringToPrecomputedChunk('</tr></table>');
const startSegmentColGroup = stringToPrecomputedChunk('<table hidden><colgroup id="');
const startSegmentColGroup2 = stringToPrecomputedChunk('">');
const endSegmentColGroup = stringToPrecomputedChunk('</colgroup></table>');
function writeStartSegment(destination, responseState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
    case HTML_MODE:
      {
        writeChunk(destination, startSegmentHTML);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentHTML2);
      }

    case SVG_MODE:
      {
        writeChunk(destination, startSegmentSVG);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentSVG2);
      }

    case MATHML_MODE:
      {
        writeChunk(destination, startSegmentMathML);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentMathML2);
      }

    case HTML_TABLE_MODE:
      {
        writeChunk(destination, startSegmentTable);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentTable2);
      }
    // TODO: For the rest of these, there will be extra wrapper nodes that never
    // get deleted from the document. We need to delete the table too as part
    // of the injected scripts. They are invisible though so it's not too terrible
    // and it's kind of an edge case to suspend in a table. Totally supported though.

    case HTML_TABLE_BODY_MODE:
      {
        writeChunk(destination, startSegmentTableBody);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentTableBody2);
      }

    case HTML_TABLE_ROW_MODE:
      {
        writeChunk(destination, startSegmentTableRow);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentTableRow2);
      }

    case HTML_COLGROUP_MODE:
      {
        writeChunk(destination, startSegmentColGroup);
        writeChunk(destination, responseState.segmentPrefix);
        writeChunk(destination, stringToChunk(id.toString(16)));
        return writeChunk(destination, startSegmentColGroup2);
      }

    default:
      {
        {
          {
            throw Error( formatProdErrorMessage(397));
          }
        }
      }
  }
}
function writeEndSegment(destination, formatContext) {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
    case HTML_MODE:
      {
        return writeChunk(destination, endSegmentHTML);
      }

    case SVG_MODE:
      {
        return writeChunk(destination, endSegmentSVG);
      }

    case MATHML_MODE:
      {
        return writeChunk(destination, endSegmentMathML);
      }

    case HTML_TABLE_MODE:
      {
        return writeChunk(destination, endSegmentTable);
      }

    case HTML_TABLE_BODY_MODE:
      {
        return writeChunk(destination, endSegmentTableBody);
      }

    case HTML_TABLE_ROW_MODE:
      {
        return writeChunk(destination, endSegmentTableRow);
      }

    case HTML_COLGROUP_MODE:
      {
        return writeChunk(destination, endSegmentColGroup);
      }

    default:
      {
        {
          {
            throw Error( formatProdErrorMessage(397));
          }
        }
      }
  }
} // Instruction Set
// The following code is the source scripts that we then minify and inline below,
// with renamed function names that we hope don't collide:
// const COMMENT_NODE = 8;
// const SUSPENSE_START_DATA = '$';
// const SUSPENSE_END_DATA = '/$';
// const SUSPENSE_PENDING_START_DATA = '$?';
// const SUSPENSE_FALLBACK_START_DATA = '$!';
//
// function clientRenderBoundary(suspenseBoundaryID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//   // Tag it to be client rendered.
//   suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
//   // Tell React to retry it if the parent already hydrated.
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
// function completeBoundary(suspenseBoundaryID, contentID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   const contentNode = document.getElementById(contentID);
//   // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
//   // This might also help by not causing recalcing each time we move a child from here to the target.
//   contentNode.parentNode.removeChild(contentNode);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated. That's fine there's nothing to do
//     // but we have to make sure that we already deleted the container node.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//
//   // Clear all the existing children. This is complicated because
//   // there can be embedded Suspense boundaries in the fallback.
//   // This is similar to clearSuspenseBoundary in ReactDOMHostConfig.
//   // TODO: We could avoid this if we never emitted suspense boundaries in fallback trees.
//   // They never hydrate anyway. However, currently we support incrementally loading the fallback.
//   const parentInstance = suspenseNode.parentNode;
//   let node = suspenseNode.nextSibling;
//   let depth = 0;
//   do {
//     if (node && node.nodeType === COMMENT_NODE) {
//       const data = node.data;
//       if (data === SUSPENSE_END_DATA) {
//         if (depth === 0) {
//           break;
//         } else {
//           depth--;
//         }
//       } else if (
//         data === SUSPENSE_START_DATA ||
//         data === SUSPENSE_PENDING_START_DATA ||
//         data === SUSPENSE_FALLBACK_START_DATA
//       ) {
//         depth++;
//       }
//     }
//
//     const nextNode = node.nextSibling;
//     parentInstance.removeChild(node);
//     node = nextNode;
//   } while (node);
//
//   const endOfBoundary = node;
//
//   // Insert all the children from the contentNode between the start and end of suspense boundary.
//   while (contentNode.firstChild) {
//     parentInstance.insertBefore(contentNode.firstChild, endOfBoundary);
//   }
//   suspenseNode.data = SUSPENSE_START_DATA;
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
// function completeSegment(containerID, placeholderID) {
//   const segmentContainer = document.getElementById(containerID);
//   const placeholderNode = document.getElementById(placeholderID);
//   // We always expect both nodes to exist here because, while we might
//   // have navigated away from the main tree, we still expect the detached
//   // tree to exist.
//   segmentContainer.parentNode.removeChild(segmentContainer);
//   while (segmentContainer.firstChild) {
//     placeholderNode.parentNode.insertBefore(
//       segmentContainer.firstChild,
//       placeholderNode,
//     );
//   }
//   placeholderNode.parentNode.removeChild(placeholderNode);
// }

const completeSegmentFunction = 'function $RS(b,f){var a=document.getElementById(b),c=document.getElementById(f);for(a.parentNode.removeChild(a);a.firstChild;)c.parentNode.insertBefore(a.firstChild,c);c.parentNode.removeChild(c)}';
const completeBoundaryFunction = 'function $RC(b,f){var a=document.getElementById(b),c=document.getElementById(f);c.parentNode.removeChild(c);if(a){do a=a.previousSibling;while(8!==a.nodeType||"$?"!==a.data);var h=a.parentNode,d=a.nextSibling,g=0;do{if(d&&8===d.nodeType){var e=d.data;if("/$"===e)if(0===g)break;else g--;else"$"!==e&&"$?"!==e&&"$!"!==e||g++}e=d.nextSibling;h.removeChild(d);d=e}while(d);for(;c.firstChild;)h.insertBefore(c.firstChild,d);a.data="$";a._reactRetry&&a._reactRetry()}}';
const clientRenderFunction = 'function $RX(b){if(b=document.getElementById(b)){do b=b.previousSibling;while(8!==b.nodeType||"$?"!==b.data);b.data="$!";b._reactRetry&&b._reactRetry()}}';
const completeSegmentScript1Full = stringToPrecomputedChunk('<script>' + completeSegmentFunction + ';$RS("');
const completeSegmentScript1Partial = stringToPrecomputedChunk('<script>$RS("');
const completeSegmentScript2 = stringToPrecomputedChunk('","');
const completeSegmentScript3 = stringToPrecomputedChunk('")</script>');
function writeCompletedSegmentInstruction(destination, responseState, contentSegmentID) {
  if (!responseState.sentCompleteSegmentFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteSegmentFunction = true;
    writeChunk(destination, completeSegmentScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeSegmentScript1Partial);
  }

  writeChunk(destination, responseState.segmentPrefix);
  const formattedID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedID);
  writeChunk(destination, completeSegmentScript2);
  writeChunk(destination, responseState.placeholderPrefix);
  writeChunk(destination, formattedID);
  return writeChunk(destination, completeSegmentScript3);
}
const completeBoundaryScript1Full = stringToPrecomputedChunk('<script>' + completeBoundaryFunction + ';$RC("');
const completeBoundaryScript1Partial = stringToPrecomputedChunk('<script>$RC("');
const completeBoundaryScript2 = stringToPrecomputedChunk('","');
const completeBoundaryScript3 = stringToPrecomputedChunk('")</script>');
function writeCompletedBoundaryInstruction(destination, responseState, boundaryID, contentSegmentID) {
  if (!responseState.sentCompleteBoundaryFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteBoundaryFunction = true;
    writeChunk(destination, completeBoundaryScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeBoundaryScript1Partial);
  }

  const formattedBoundaryID = boundaryID.formattedID;

  if (!(formattedBoundaryID !== null)) {
    {
      throw Error( formatProdErrorMessage(395));
    }
  }

  const formattedContentID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedBoundaryID);
  writeChunk(destination, completeBoundaryScript2);
  writeChunk(destination, responseState.segmentPrefix);
  writeChunk(destination, formattedContentID);
  return writeChunk(destination, completeBoundaryScript3);
}
const clientRenderScript1Full = stringToPrecomputedChunk('<script>' + clientRenderFunction + ';$RX("');
const clientRenderScript1Partial = stringToPrecomputedChunk('<script>$RX("');
const clientRenderScript2 = stringToPrecomputedChunk('")</script>');
function writeClientRenderBoundaryInstruction(destination, responseState, boundaryID) {
  if (!responseState.sentClientRenderFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentClientRenderFunction = true;
    writeChunk(destination, clientRenderScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, clientRenderScript1Partial);
  }

  const formattedBoundaryID = boundaryID.formattedID;

  if (!(formattedBoundaryID !== null)) {
    {
      throw Error( formatProdErrorMessage(395));
    }
  }

  writeChunk(destination, formattedBoundaryID);
  return writeChunk(destination, clientRenderScript2);
}

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
let REACT_ELEMENT_TYPE = 0xeac7;
let REACT_PORTAL_TYPE = 0xeaca;
let REACT_FRAGMENT_TYPE = 0xeacb;
let REACT_STRICT_MODE_TYPE = 0xeacc;
let REACT_PROFILER_TYPE = 0xead2;
let REACT_PROVIDER_TYPE = 0xeacd;
let REACT_CONTEXT_TYPE = 0xeace;
let REACT_FORWARD_REF_TYPE = 0xead0;
let REACT_SUSPENSE_TYPE = 0xead1;
let REACT_SUSPENSE_LIST_TYPE = 0xead8;
let REACT_MEMO_TYPE = 0xead3;
let REACT_LAZY_TYPE = 0xead4;
let REACT_SCOPE_TYPE = 0xead7;
let REACT_DEBUG_TRACING_MODE_TYPE = 0xeae1;
let REACT_LEGACY_HIDDEN_TYPE = 0xeae3;

if (typeof Symbol === 'function' && Symbol.for) {
  const symbolFor = Symbol.for;
  REACT_ELEMENT_TYPE = symbolFor('react.element');
  REACT_PORTAL_TYPE = symbolFor('react.portal');
  REACT_FRAGMENT_TYPE = symbolFor('react.fragment');
  REACT_STRICT_MODE_TYPE = symbolFor('react.strict_mode');
  REACT_PROFILER_TYPE = symbolFor('react.profiler');
  REACT_PROVIDER_TYPE = symbolFor('react.provider');
  REACT_CONTEXT_TYPE = symbolFor('react.context');
  REACT_FORWARD_REF_TYPE = symbolFor('react.forward_ref');
  REACT_SUSPENSE_TYPE = symbolFor('react.suspense');
  REACT_SUSPENSE_LIST_TYPE = symbolFor('react.suspense_list');
  REACT_MEMO_TYPE = symbolFor('react.memo');
  REACT_LAZY_TYPE = symbolFor('react.lazy');
  REACT_SCOPE_TYPE = symbolFor('react.scope');
  REACT_DEBUG_TRACING_MODE_TYPE = symbolFor('react.debug_trace_mode');
  REACT_LEGACY_HIDDEN_TYPE = symbolFor('react.legacy_hidden');
}

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  const maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;

const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

const emptyContextObject = {};

// Forming a reverse tree.


const rootContextSnapshot = null; // We assume that this runtime owns the "current" field on all ReactContext instances.
// This global (actually thread local) state represents what state all those "current",
// fields are currently in.

let currentActiveSnapshot = null;

function popNode(prev) {
  {
    prev.context._currentValue = prev.parentValue;
  }
}

function pushNode(next) {
  {
    next.context._currentValue = next.value;
  }
}

function popToNearestCommonAncestor(prev, next) {
  if (prev === next) ; else {
    popNode(prev);
    const parentPrev = prev.parent;
    const parentNext = next.parent;

    if (parentPrev === null) {
      if (!(parentNext === null)) {
        {
          throw Error( formatProdErrorMessage(401));
        }
      }
    } else {
      if (!(parentNext !== null)) {
        {
          throw Error( formatProdErrorMessage(401));
        }
      }

      popToNearestCommonAncestor(parentPrev, parentNext); // On the way back, we push the new ones that weren't common.

      pushNode(next);
    }
  }
}

function popAllPrevious(prev) {
  popNode(prev);
  const parentPrev = prev.parent;

  if (parentPrev !== null) {
    popAllPrevious(parentPrev);
  }
}

function pushAllNext(next) {
  const parentNext = next.parent;

  if (parentNext !== null) {
    pushAllNext(parentNext);
  }

  pushNode(next);
}

function popPreviousToCommonLevel(prev, next) {
  popNode(prev);
  const parentPrev = prev.parent;

  if (!(parentPrev !== null)) {
    {
      throw Error( formatProdErrorMessage(402));
    }
  }

  if (parentPrev.depth === next.depth) {
    // We found the same level. Now we just need to find a shared ancestor.
    popToNearestCommonAncestor(parentPrev, next);
  } else {
    // We must still be deeper.
    popPreviousToCommonLevel(parentPrev, next);
  }
}

function popNextToCommonLevel(prev, next) {
  const parentNext = next.parent;

  if (!(parentNext !== null)) {
    {
      throw Error( formatProdErrorMessage(402));
    }
  }

  if (prev.depth === parentNext.depth) {
    // We found the same level. Now we just need to find a shared ancestor.
    popToNearestCommonAncestor(prev, parentNext);
  } else {
    // We must still be deeper.
    popNextToCommonLevel(prev, parentNext);
  }

  pushNode(next);
} // Perform context switching to the new snapshot.
// To make it cheap to read many contexts, while not suspending, we make the switch eagerly by
// updating all the context's current values. That way reads, always just read the current value.
// At the cost of updating contexts even if they're never read by this subtree.


function switchContext(newSnapshot) {
  // The basic algorithm we need to do is to pop back any contexts that are no longer on the stack.
  // We also need to update any new contexts that are now on the stack with the deepest value.
  // The easiest way to update new contexts is to just reapply them in reverse order from the
  // perspective of the backpointers. To avoid allocating a lot when switching, we use the stack
  // for that. Therefore this algorithm is recursive.
  // 1) First we pop which ever snapshot tree was deepest. Popping old contexts as we go.
  // 2) Then we find the nearest common ancestor from there. Popping old contexts as we go.
  // 3) Then we reapply new contexts on the way back up the stack.
  const prev = currentActiveSnapshot;
  const next = newSnapshot;

  if (prev !== next) {
    if (prev === null) {
      // $FlowFixMe: This has to be non-null since it's not equal to prev.
      pushAllNext(next);
    } else if (next === null) {
      popAllPrevious(prev);
    } else if (prev.depth === next.depth) {
      popToNearestCommonAncestor(prev, next);
    } else if (prev.depth > next.depth) {
      popPreviousToCommonLevel(prev, next);
    } else {
      popNextToCommonLevel(prev, next);
    }

    currentActiveSnapshot = next;
  }
}
function pushProvider(context, nextValue) {
  let prevValue;

  {
    prevValue = context._currentValue;
    context._currentValue = nextValue;
  }

  const prevNode = currentActiveSnapshot;
  const newNode = {
    parent: prevNode,
    depth: prevNode === null ? 0 : prevNode.depth + 1,
    context: context,
    parentValue: prevValue,
    value: nextValue
  };
  currentActiveSnapshot = newNode;
  return newNode;
}
function popProvider(context) {
  const prevSnapshot = currentActiveSnapshot;

  if (!(prevSnapshot !== null)) {
    {
      throw Error( formatProdErrorMessage(403));
    }
  }

  {
    prevSnapshot.context._currentValue = prevSnapshot.parentValue;
  }

  return currentActiveSnapshot = prevSnapshot.parent;
}
function getActiveContext() {
  return currentActiveSnapshot;
}
function readContext(context) {
  const value =  context._currentValue ;
  return value;
}

/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 *
 * Note that this module is currently shared and assumed to be stateless.
 * If this becomes an actual Map, that will break.
 */
function get(key) {
  return key._reactInternals;
}
function set(key, value) {
  key._reactInternals = value;
}

const classComponentUpdater = {
  isMounted(inst) {
    return false;
  },

  enqueueSetState(inst, payload, callback) {
    const internals = get(inst);

    if (internals.queue === null) ; else {
      internals.queue.push(payload);
    }
  },

  enqueueReplaceState(inst, payload, callback) {
    const internals = get(inst);
    internals.replace = true;
    internals.queue = [payload];
  },

  enqueueForceUpdate(inst, callback) {
    const internals = get(inst);

    if (internals.queue === null) ;
  }

};

function applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, prevState, nextProps) {
  const partialState = getDerivedStateFromProps(nextProps, prevState);


  const newState = partialState === null || partialState === undefined ? prevState : Object.assign({}, prevState, partialState);
  return newState;
}

function constructClassInstance(ctor, props, maskedLegacyContext) {
  let context = emptyContextObject;
  const contextType = ctor.contextType;

  if (typeof contextType === 'object' && contextType !== null) {
    context = readContext(contextType);
  }

  const instance = new ctor(props, context);

  return instance;
}

function callComponentWillMount(type, instance) {
  const oldState = instance.state;

  if (typeof instance.componentWillMount === 'function') {

    instance.componentWillMount();
  }

  if (typeof instance.UNSAFE_componentWillMount === 'function') {
    instance.UNSAFE_componentWillMount();
  }

  if (oldState !== instance.state) {

    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
  }
}

function processUpdateQueue(internalInstance, inst, props, maskedLegacyContext) {
  if (internalInstance.queue !== null && internalInstance.queue.length > 0) {
    const oldQueue = internalInstance.queue;
    const oldReplace = internalInstance.replace;
    internalInstance.queue = null;
    internalInstance.replace = false;

    if (oldReplace && oldQueue.length === 1) {
      inst.state = oldQueue[0];
    } else {
      let nextState = oldReplace ? oldQueue[0] : inst.state;
      let dontMutate = true;

      for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
        const partial = oldQueue[i];
        const partialState = typeof partial === 'function' ? partial.call(inst, nextState, props, maskedLegacyContext) : partial;

        if (partialState != null) {
          if (dontMutate) {
            dontMutate = false;
            nextState = Object.assign({}, nextState, partialState);
          } else {
            Object.assign(nextState, partialState);
          }
        }
      }

      inst.state = nextState;
    }
  } else {
    internalInstance.queue = null;
  }
} // Invokes the mount life-cycles on a previously never rendered instance.


function mountClassInstance(instance, ctor, newProps, maskedLegacyContext) {

  const initialState = instance.state !== undefined ? instance.state : null;
  instance.updater = classComponentUpdater;
  instance.props = newProps;
  instance.state = initialState; // We don't bother initializing the refs object on the server, since we're not going to resolve them anyway.
  // The internal instance will be used to manage updates that happen during this mount.

  const internalInstance = {
    queue: [],
    replace: false
  };
  set(instance, internalInstance);
  const contextType = ctor.contextType;

  if (typeof contextType === 'object' && contextType !== null) {
    instance.context = readContext(contextType);
  } else {
    instance.context = emptyContextObject;
  }

  const getDerivedStateFromProps = ctor.getDerivedStateFromProps;

  if (typeof getDerivedStateFromProps === 'function') {
    instance.state = applyDerivedStateFromProps(instance, ctor, getDerivedStateFromProps, initialState, newProps);
  } // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.


  if (typeof ctor.getDerivedStateFromProps !== 'function' && typeof instance.getSnapshotBeforeUpdate !== 'function' && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
    callComponentWillMount(ctor, instance); // If we had additional state updates during this life-cycle, let's
    // process them now.

    processUpdateQueue(internalInstance, instance, newProps, maskedLegacyContext);
  }
}

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y // eslint-disable-line no-self-compare
  ;
}

const objectIs = typeof Object.is === 'function' ? Object.is : is;

let currentlyRenderingComponent = null;
let firstWorkInProgressHook = null;
let workInProgressHook = null; // Whether the work-in-progress hook is a re-rendered hook

let isReRender = false; // Whether an update was scheduled during the currently executing render pass.

let didScheduleRenderPhaseUpdate = false; // Lazily created map of render-phase updates

let renderPhaseUpdates = null; // Counter to prevent infinite loops.

let numberOfReRenders = 0;
const RE_RENDER_LIMIT = 25;

function resolveCurrentlyRenderingComponent() {
  if (!(currentlyRenderingComponent !== null)) {
    {
      throw Error( formatProdErrorMessage(321));
    }
  }

  return currentlyRenderingComponent;
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {

    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (objectIs(nextDeps[i], prevDeps[i])) {
      continue;
    }

    return false;
  }

  return true;
}

function createHook() {
  if (numberOfReRenders > 0) {
    {
      {
        throw Error( formatProdErrorMessage(312));
      }
    }
  }

  return {
    memoizedState: null,
    queue: null,
    next: null
  };
}

function createWorkInProgressHook() {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      firstWorkInProgressHook = workInProgressHook = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false; // Append to the end of the list

      workInProgressHook = workInProgressHook.next = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
    }
  }

  return workInProgressHook;
}

function prepareToUseHooks(componentIdentity) {
  currentlyRenderingComponent = componentIdentity;
  // didScheduleRenderPhaseUpdate = false;
  // firstWorkInProgressHook = null;
  // numberOfReRenders = 0;
  // renderPhaseUpdates = null;
  // workInProgressHook = null;

}
function finishHooks(Component, props, children, refOrContext) {
  // This must be called after every function component to prevent hooks from
  // being used in classes.
  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1; // Start over from the beginning of the list

    workInProgressHook = null;
    children = Component(props, refOrContext);
  }

  resetHooksState();
  return children;
} // Reset the internal hooks state if an error occurs while rendering a component

function resetHooksState() {

  currentlyRenderingComponent = null;
  didScheduleRenderPhaseUpdate = false;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  renderPhaseUpdates = null;
  workInProgressHook = null;
}

function getCacheForType(resourceType) {
  // TODO: This should silently mark this as client rendered since it's not necesssarily
  // considered an error. It needs to work for things like Flight though.
  {
    {
      throw Error( formatProdErrorMessage(248));
    }
  }
}

function readContext$1(context) {

  return readContext(context);
}

function useContext(context) {

  resolveCurrentlyRenderingComponent();
  return readContext(context);
}

function basicStateReducer(state, action) {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

function useState(initialState) {

  return useReducer(basicStateReducer, // useReducer has a special case to support lazy useState initializers
  initialState);
}
function useReducer(reducer, initialArg, init) {

  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();

  if (isReRender) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    const queue = workInProgressHook.queue;
    const dispatch = queue.dispatch;

    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
      const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

      if (firstRenderPhaseUpdate !== undefined) {
        renderPhaseUpdates.delete(queue);
        let newState = workInProgressHook.memoizedState;
        let update = firstRenderPhaseUpdate;

        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          const action = update.action;

          newState = reducer(newState, action);

          update = update.next;
        } while (update !== null);

        workInProgressHook.memoizedState = newState;
        return [newState, dispatch];
      }
    }

    return [workInProgressHook.memoizedState, dispatch];
  } else {

    let initialState;

    if (reducer === basicStateReducer) {
      // Special case for `useState`.
      initialState = typeof initialArg === 'function' ? initialArg() : initialArg;
    } else {
      initialState = init !== undefined ? init(initialArg) : initialArg;
    }

    workInProgressHook.memoizedState = initialState;
    const queue = workInProgressHook.queue = {
      last: null,
      dispatch: null
    };
    const dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, queue);
    return [workInProgressHook.memoizedState, dispatch];
  }
}

function useMemo(nextCreate, deps) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  if (workInProgressHook !== null) {
    const prevState = workInProgressHook.memoizedState;

    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }
  }

  const nextValue = nextCreate();

  workInProgressHook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function useRef(initialValue) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  const previousRef = workInProgressHook.memoizedState;

  if (previousRef === null) {
    const ref = {
      current: initialValue
    };

    workInProgressHook.memoizedState = ref;
    return ref;
  } else {
    return previousRef;
  }
}

function useLayoutEffect(create, inputs) {
}

function dispatchAction(componentIdentity, queue, action) {
  if (!(numberOfReRenders < RE_RENDER_LIMIT)) {
    {
      throw Error( formatProdErrorMessage(301));
    }
  }

  if (componentIdentity === currentlyRenderingComponent) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    const update = {
      action,
      next: null
    };

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }

    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;

      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }

      lastRenderPhaseUpdate.next = update;
    }
  }
}

function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
} // TODO Decide on how to implement this hook for server rendering.
// If a mutation occurs during render, consider triggering a Suspense boundary
// and falling back to client rendering.

function useMutableSource(source, getSnapshot, subscribe) {
  resolveCurrentlyRenderingComponent();
  return getSnapshot(source._source);
}

function useSyncExternalStore(subscribe, getSnapshot) {
  throw new Error('Not yet implemented');
}

function useDeferredValue(value) {
  resolveCurrentlyRenderingComponent();
  return value;
}

function unsupportedStartTransition() {
  {
    {
      throw Error( formatProdErrorMessage(394));
    }
  }
}

function useTransition() {
  resolveCurrentlyRenderingComponent();
  return [false, unsupportedStartTransition];
}

function useOpaqueIdentifier() {
  return makeServerID(currentResponseState);
}

function unsupportedRefresh() {
  {
    {
      throw Error( formatProdErrorMessage(393));
    }
  }
}

function useCacheRefresh() {
  return unsupportedRefresh;
}

function noop() {}

const Dispatcher = {
  readContext: readContext$1,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop,
  // Effects are not run in the server environment.
  useEffect: noop,
  // Debugging effect
  useDebugValue: noop,
  useDeferredValue,
  useTransition,
  useOpaqueIdentifier,
  // Subscriptions are not setup in a server environment.
  useMutableSource,
  useSyncExternalStore
};

{
  Dispatcher.getCacheForType = getCacheForType;
  Dispatcher.useCacheRefresh = useCacheRefresh;
}

let currentResponseState = null;
function setCurrentResponseState(responseState) {
  currentResponseState = responseState;
}

const ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
const ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
const PENDING = 0;
const COMPLETED = 1;
const FLUSHED = 2;
const ABORTED = 3;
const ERRORED = 4;
const BUFFERING = 0;
const FLOWING = 1;
const CLOSED = 2;
// This is a default heuristic for how to split up the HTML content into progressive
// loading. Our goal is to be able to display additional new content about every 500ms.
// Faster than that is unnecessary and should be throttled on the client. It also
// adds unnecessary overhead to do more splits. We don't know if it's a higher or lower
// end device but higher end suffer less from the overhead than lower end does from
// not getting small enough pieces. We error on the side of low end.
// We base this on low end 3G speeds which is about 500kbits per second. We assume
// that there can be a reasonable drop off from max bandwidth which leaves you with
// as little as 80%. We can receive half of that each 500ms - at best. In practice,
// a little bandwidth is lost to processing and contention - e.g. CSS and images that
// are downloaded along with the main content. So we estimate about half of that to be
// the lower end throughput. In other words, we expect that you can at least show
// about 12.5kb of content per 500ms. Not counting starting latency for the first
// paint.
// 500 * 1024 / 8 * .8 * 0.5 / 2
const DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;

function defaultErrorHandler(error) {
  console['error'](error); // Don't transform to our wrapper
}

function noop$1() {}

function createRequest(children, destination, responseState, rootFormatContext, progressiveChunkSize, onError, onCompleteAll, onReadyToStream) {
  const pingedTasks = [];
  const abortSet = new Set();
  const request = {
    destination,
    responseState,
    progressiveChunkSize: progressiveChunkSize === undefined ? DEFAULT_PROGRESSIVE_CHUNK_SIZE : progressiveChunkSize,
    status: BUFFERING,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    completedRootSegment: null,
    abortableTasks: abortSet,
    pingedTasks: pingedTasks,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    onError: onError === undefined ? defaultErrorHandler : onError,
    onCompleteAll: onCompleteAll === undefined ? noop$1 : onCompleteAll,
    onReadyToStream: onReadyToStream === undefined ? noop$1 : onReadyToStream
  }; // This segment represents the root fallback.

  const rootSegment = createPendingSegment(request, 0, null, rootFormatContext); // There is no parent so conceptually, we're unblocked to flush this segment.

  rootSegment.parentFlushed = true;
  const rootTask = createTask(request, children, null, rootSegment, abortSet, emptyContextObject, rootContextSnapshot, null);
  pingedTasks.push(rootTask);
  return request;
}

function pingTask(request, task) {
  const pingedTasks = request.pingedTasks;
  pingedTasks.push(task);

  if (pingedTasks.length === 1) ;
}

function createSuspenseBoundary(request, fallbackAbortableTasks) {
  return {
    id: createSuspenseBoundaryID(request.responseState),
    rootSegmentID: -1,
    parentFlushed: false,
    pendingTasks: 0,
    forceClientRender: false,
    completedSegments: [],
    byteSize: 0,
    fallbackAbortableTasks
  };
}

function createTask(request, node, blockedBoundary, blockedSegment, abortSet, legacyContext, context, assignID) {
  request.allPendingTasks++;

  if (blockedBoundary === null) {
    request.pendingRootTasks++;
  } else {
    blockedBoundary.pendingTasks++;
  }

  const task = {
    node,
    ping: () => pingTask(request, task),
    blockedBoundary,
    blockedSegment,
    abortSet,
    legacyContext,
    context,
    assignID
  };

  abortSet.add(task);
  return task;
}

function createPendingSegment(request, index, boundary, formatContext) {
  return {
    status: PENDING,
    id: -1,
    // lazily assigned later
    index,
    parentFlushed: false,
    chunks: [],
    children: [],
    formatContext,
    boundary
  };
} // DEV-only global reference to the currently executing task

function pushFunctionComponentStackInDEV(task, type) {
}

function popComponentStackInDEV(task) {
}

function reportError(request, error) {
  // If this callback errors, we intentionally let that error bubble up to become a fatal error
  // so that someone fixes the error reporting instead of hiding it.
  const onError = request.onError;
  onError(error);
}

function fatalError(request, error) {
  // This is called outside error handling code such as if the root errors outside
  // a suspense boundary or if the root suspense boundary's fallback errors.
  // It's also called if React itself or its host configs errors.
  request.status = CLOSED;
  closeWithError(request.destination, error);
}

function renderSuspenseBoundary(request, task, props) {
  const parentBoundary = task.blockedBoundary;
  const parentSegment = task.blockedSegment; // We need to push an "empty" thing here to identify the parent suspense boundary.

  pushEmpty(parentSegment.chunks, request.responseState, task.assignID);
  task.assignID = null; // Each time we enter a suspense boundary, we split out into a new segment for
  // the fallback so that we can later replace that segment with the content.
  // This also lets us split out the main content even if it doesn't suspend,
  // in case it ends up generating a large subtree of content.

  const fallback = props.fallback;
  const content = props.children;
  const fallbackAbortSet = new Set();
  const newBoundary = createSuspenseBoundary(request, fallbackAbortSet);
  const insertionIndex = parentSegment.chunks.length; // The children of the boundary segment is actually the fallback.

  const boundarySegment = createPendingSegment(request, insertionIndex, newBoundary, parentSegment.formatContext);
  parentSegment.children.push(boundarySegment); // This segment is the actual child content. We can start rendering that immediately.

  const contentRootSegment = createPendingSegment(request, 0, null, parentSegment.formatContext); // We mark the root segment as having its parent flushed. It's not really flushed but there is
  // no parent segment so there's nothing to wait on.

  contentRootSegment.parentFlushed = true; // Currently this is running synchronously. We could instead schedule this to pingedTasks.
  // I suspect that there might be some efficiency benefits from not creating the suspended task
  // and instead just using the stack if possible.
  // TODO: Call this directly instead of messing with saving and restoring contexts.
  // We can reuse the current context and task to render the content immediately without
  // context switching. We just need to temporarily switch which boundary and which segment
  // we're writing to. If something suspends, it'll spawn new suspended task with that context.

  task.blockedBoundary = newBoundary;
  task.blockedSegment = contentRootSegment;

  try {
    // We use the safe form because we don't handle suspending here. Only error handling.
    renderNode(request, task, content);
    contentRootSegment.status = COMPLETED;
    newBoundary.completedSegments.push(contentRootSegment);

    if (newBoundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      // Therefore we won't need the fallback. We early return so that we don't have to create
      // the fallback.
      popComponentStackInDEV(task);
      return;
    }
  } catch (error) {
    contentRootSegment.status = ERRORED;
    reportError(request, error);
    newBoundary.forceClientRender = true; // We don't need to decrement any task numbers because we didn't spawn any new task.
    // We don't need to schedule any task because we know the parent has written yet.
    // We do need to fallthrough to create the fallback though.
  } finally {
    task.blockedBoundary = parentBoundary;
    task.blockedSegment = parentSegment;
  } // This injects an extra segment just to contain an empty tag with an ID.
  // This means that we're not actually using the assignID anywhere.
  // TODO: Rethink the assignID approach.


  pushEmpty(boundarySegment.chunks, request.responseState, newBoundary.id);
  const innerSegment = createPendingSegment(request, boundarySegment.chunks.length, null, boundarySegment.formatContext);
  boundarySegment.status = COMPLETED;
  boundarySegment.children.push(innerSegment); // We create suspended task for the fallback because we don't want to actually work
  // on it yet in case we finish the main content, so we queue for later.

  const suspendedFallbackTask = createTask(request, fallback, parentBoundary, innerSegment, fallbackAbortSet, task.legacyContext, task.context, null);
  // on preparing fallbacks if we don't have any more main content to task on.


  request.pingedTasks.push(suspendedFallbackTask);
}

function renderHostElement(request, task, type, props) {
  const segment = task.blockedSegment;
  const children = pushStartInstance(segment.chunks, type, props, request.responseState, segment.formatContext, task.assignID); // We must have assigned it already above so we don't need this anymore.

  task.assignID = null;
  const prevContext = segment.formatContext;
  segment.formatContext = getChildFormatContext(prevContext, type, props); // We use the non-destructive form because if something suspends, we still
  // need to pop back up and finish this subtree of HTML.

  renderNode(request, task, children); // We expect that errors will fatal the whole task and that we don't need
  // the correct context. Therefore this is not in a finally.

  segment.formatContext = prevContext;
  pushEndInstance(segment.chunks, type);
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function renderWithHooks(request, task, Component, props, secondArg) {
  const componentIdentity = {};
  prepareToUseHooks(componentIdentity);
  const result = Component(props, secondArg);
  return finishHooks(Component, props, result, secondArg);
}

function finishClassComponent(request, task, instance, Component, props) {
  const nextChildren = instance.render();

  renderNodeDestructive(request, task, nextChildren);
}

function renderClassComponent(request, task, Component, props) {
  const maskedContext =  undefined;
  const instance = constructClassInstance(Component, props);
  mountClassInstance(instance, Component, props, maskedContext);
  finishClassComponent(request, task, instance);
}
// components for some reason.

function renderIndeterminateComponent(request, task, Component, props) {
  let legacyContext;

  const value = renderWithHooks(request, task, Component, props, legacyContext);

  {
    // the previous task every again, so we can use the destructive recursive form.


    renderNodeDestructive(request, task, value);
  }
}

function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;

    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }

    return props;
  }

  return baseProps;
}

function renderForwardRef(request, task, type, props, ref) {
  pushFunctionComponentStackInDEV(task, type.render);
  const children = renderWithHooks(request, task, type.render, props, ref);
  renderNodeDestructive(request, task, children);
}

function renderMemo(request, task, type, props, ref) {
  const innerType = type.type;
  const resolvedProps = resolveDefaultProps(innerType, props);
  renderElement(request, task, innerType, resolvedProps, ref);
}

function renderContextConsumer(request, task, context, props) {

  const render = props.children;

  const newValue = readContext(context);
  const newChildren = render(newValue);
  renderNodeDestructive(request, task, newChildren);
}

function renderContextProvider(request, task, type, props) {
  const context = type._context;
  const value = props.value;
  const children = props.children;

  task.context = pushProvider(context, value);
  renderNodeDestructive(request, task, children);
  task.context = popProvider();
}

function renderLazyComponent(request, task, lazyComponent, props, ref) {
  const payload = lazyComponent._payload;
  const init = lazyComponent._init;
  const Component = init(payload);
  const resolvedProps = resolveDefaultProps(Component, props);
  renderElement(request, task, Component, resolvedProps, ref);
}

function renderElement(request, task, type, props, ref) {
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      renderClassComponent(request, task, type, props);
      return;
    } else {
      renderIndeterminateComponent(request, task, type, props);
      return;
    }
  }

  if (typeof type === 'string') {
    renderHostElement(request, task, type, props);
    return;
  }

  switch (type) {
    // TODO: LegacyHidden acts the same as a fragment. This only works
    // because we currently assume that every instance of LegacyHidden is
    // accompanied by a host component wrapper. In the hidden mode, the host
    // component is given a `hidden` attribute, which ensures that the
    // initial HTML is not visible. To support the use of LegacyHidden as a
    // true fragment, without an extra DOM node, we would have to hide the
    // initial HTML in some other way.
    // TODO: Add REACT_OFFSCREEN_TYPE here too with the same capability.
    case REACT_LEGACY_HIDDEN_TYPE:
    case REACT_DEBUG_TRACING_MODE_TYPE:
    case REACT_STRICT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE:
      {
        renderNodeDestructive(request, task, props.children);
        return;
      }

    case REACT_SUSPENSE_LIST_TYPE:
      {

        renderNodeDestructive(request, task, props.children);
        return;
      }

    case REACT_SCOPE_TYPE:
      {
        {
          renderNodeDestructive(request, task, props.children);
          return;
        }
      }
    // eslint-disable-next-line-no-fallthrough

    case REACT_SUSPENSE_TYPE:
      {
        renderSuspenseBoundary(request, task, props);
        return;
      }
  }

  if (typeof type === 'object' && type !== null) {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        {
          renderForwardRef(request, task, type, props, ref);
          return;
        }

      case REACT_MEMO_TYPE:
        {
          renderMemo(request, task, type, props, ref);
          return;
        }

      case REACT_PROVIDER_TYPE:
        {
          renderContextProvider(request, task, type, props);
          return;
        }

      case REACT_CONTEXT_TYPE:
        {
          renderContextConsumer(request, task, type, props);
          return;
        }

      case REACT_LAZY_TYPE:
        {
          renderLazyComponent(request, task, type, props);
          return;
        }
    }
  }

  let info = '';

  {
    {
      throw Error( formatProdErrorMessage(130, type == null ? type : typeof type, info));
    }
  }
}
// to update the current execution state.


function renderNodeDestructive(request, task, node) {
  // Stash the node we're working on. We'll pick up from this task in case
  // something suspends.
  task.node = node; // Handle object types

  if (typeof node === 'object' && node !== null) {
    switch (node.$$typeof) {
      case REACT_ELEMENT_TYPE:
        {
          const element = node;
          const type = element.type;
          const props = element.props;
          const ref = element.ref;
          renderElement(request, task, type, props, ref);
          return;
        }

      case REACT_PORTAL_TYPE:
        {
          {
            throw Error( formatProdErrorMessage(257));
          }
        }

      // eslint-disable-next-line-no-fallthrough

      case REACT_LAZY_TYPE:
        {
          {
            const lazyNode = node;
            const payload = lazyNode._payload;
            const init = lazyNode._init;
            const resolvedNode = init(payload);
            renderNodeDestructive(request, task, resolvedNode);
            return;
          }
        }
    }

    if (isArray(node)) {
      if (node.length > 0) {
        for (let i = 0; i < node.length; i++) {
          // Recursively render the rest. We need to use the non-destructive form
          // so that we can safely pop back up and render the sibling if something
          // suspends.
          renderNode(request, task, node[i]);
        }
      } else {
        pushEmpty(task.blockedSegment.chunks, request.responseState, task.assignID);
        task.assignID = null;
      }

      return;
    }

    const iteratorFn = getIteratorFn(node);

    if (iteratorFn) {

      const iterator = iteratorFn.call(node);

      if (iterator) {
        let step = iterator.next(); // If there are not entries, we need to push an empty so we start by checking that.

        if (!step.done) {
          do {
            // Recursively render the rest. We need to use the non-destructive form
            // so that we can safely pop back up and render the sibling if something
            // suspends.
            renderNode(request, task, step.value);
            step = iterator.next();
          } while (!step.done);

          return;
        }
      }

      pushEmpty(task.blockedSegment.chunks, request.responseState, task.assignID);
      task.assignID = null;
    }

    const childString = Object.prototype.toString.call(node);

    {
      {
        throw Error( formatProdErrorMessage(31, childString === '[object Object]' ? 'object with keys {' + Object.keys(node).join(', ') + '}' : childString));
      }
    }
  }

  if (typeof node === 'string') {
    pushTextInstance(task.blockedSegment.chunks, node, request.responseState, task.assignID);
    task.assignID = null;
    return;
  }

  if (typeof node === 'number') {
    pushTextInstance(task.blockedSegment.chunks, '' + node, request.responseState, task.assignID);
    task.assignID = null;
    return;
  }


  pushEmpty(task.blockedSegment.chunks, request.responseState, task.assignID);
  task.assignID = null;
}

function spawnNewSuspendedTask(request, task, x) {
  // Something suspended, we'll need to create a new segment and resolve it later.
  const segment = task.blockedSegment;
  const insertionIndex = segment.chunks.length;
  const newSegment = createPendingSegment(request, insertionIndex, null, segment.formatContext);
  segment.children.push(newSegment);
  const newTask = createTask(request, task.node, task.blockedBoundary, newSegment, task.abortSet, task.legacyContext, task.context, task.assignID);


  task.assignID = null;
  const ping = newTask.ping;
  x.then(ping, ping);
} // This is a non-destructive form of rendering a node. If it suspends it spawns
// a new task and restores the context of this task to what it was before.


function renderNode(request, task, node) {
  // TODO: Store segment.children.length here and reset it in case something
  // suspended partially through writing something.
  // Snapshot the current context in case something throws to interrupt the
  // process.
  const previousFormatContext = task.blockedSegment.formatContext;
  const previousLegacyContext = task.legacyContext;
  const previousContext = task.context;

  try {
    return renderNodeDestructive(request, task, node);
  } catch (x) {
    resetHooksState();

    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      spawnNewSuspendedTask(request, task, x); // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.

      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext; // Restore all active ReactContexts to what they were before.

      switchContext(previousContext);
    } else {
      // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.
      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext; // Restore all active ReactContexts to what they were before.

      switchContext(previousContext);
      // Let's terminate the rest of the tree and don't render any siblings.


      throw x;
    }
  }
}

function erroredTask(request, boundary, segment, error) {
  // Report the error to a global handler.
  reportError(request, error);

  if (boundary === null) {
    fatalError(request, error);
  } else {
    boundary.pendingTasks--;

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true; // Regardless of what happens next, this boundary won't be displayed,
      // so we can flush it, if the parent already flushed.

      if (boundary.parentFlushed) {
        // We don't have a preference where in the queue this goes since it's likely
        // to error on the client anyway. However, intentionally client-rendered
        // boundaries should be flushed earlier so that they can start on the client.
        // We reuse the same queue for errors.
        request.clientRenderedBoundaries.push(boundary);
      }
    }
  }

  request.allPendingTasks--;

  if (request.allPendingTasks === 0) {
    const onCompleteAll = request.onCompleteAll;
    onCompleteAll();
  }
}

function abortTaskSoft(task) {
  // This aborts task without aborting the parent boundary that it blocks.
  // It's used for when we didn't need this task to complete the tree.
  // If task was needed, then it should use abortTask instead.
  const request = this;
  const boundary = task.blockedBoundary;
  const segment = task.blockedSegment;
  segment.status = ABORTED;
  finishedTask(request, boundary, segment);
}

function abortTask(task) {
  // This aborts the task and aborts the parent that it blocks, putting it into
  // client rendered mode.
  const request = this;
  const boundary = task.blockedBoundary;
  const segment = task.blockedSegment;
  segment.status = ABORTED;

  if (boundary === null) {
    request.allPendingTasks--; // We didn't complete the root so we have nothing to show. We can close
    // the request;

    if (request.status !== CLOSED) {
      request.status = CLOSED;
      close(request.destination);
    }
  } else {
    boundary.pendingTasks--;

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;

      if (boundary.parentFlushed) {
        request.clientRenderedBoundaries.push(boundary);
      }
    } // If this boundary was still pending then we haven't already cancelled its fallbacks.
    // We'll need to abort the fallbacks, which will also error that parent boundary.


    boundary.fallbackAbortableTasks.forEach(abortTask, request);
    boundary.fallbackAbortableTasks.clear();
    request.allPendingTasks--;

    if (request.allPendingTasks === 0) {
      const onCompleteAll = request.onCompleteAll;
      onCompleteAll();
    }
  }
}

function finishedTask(request, boundary, segment) {
  if (boundary === null) {
    if (segment.parentFlushed) {
      if (!(request.completedRootSegment === null)) {
        {
          throw Error( formatProdErrorMessage(389));
        }
      }

      request.completedRootSegment = segment;
    }

    request.pendingRootTasks--;

    if (request.pendingRootTasks === 0) {
      const onReadyToStream = request.onReadyToStream;
      onReadyToStream();
    }
  } else {
    boundary.pendingTasks--;

    if (boundary.forceClientRender) ; else if (boundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      if (segment.parentFlushed) {
        // Our parent segment already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          boundary.completedSegments.push(segment);
        }
      }

      if (boundary.parentFlushed) {
        // The segment might be part of a segment that didn't flush yet, but if the boundary's
        // parent flushed, we need to schedule the boundary to be emitted.
        request.completedBoundaries.push(boundary);
      } // We can now cancel any pending task on the fallback since we won't need to show it anymore.
      // This needs to happen after we read the parentFlushed flags because aborting can finish
      // work which can trigger user code, which can start flushing, which can change those flags.


      boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
      boundary.fallbackAbortableTasks.clear();
    } else {
      if (segment.parentFlushed) {
        // Our parent already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          const completedSegments = boundary.completedSegments;
          completedSegments.push(segment);

          if (completedSegments.length === 1) {
            // This is the first time since we last flushed that we completed anything.
            // We can schedule this boundary to emit its partially completed segments early
            // in case the parent has already been flushed.
            if (boundary.parentFlushed) {
              request.partialBoundaries.push(boundary);
            }
          }
        }
      }
    }
  }

  request.allPendingTasks--;

  if (request.allPendingTasks === 0) {
    // This needs to be called at the very end so that we can synchronously write the result
    // in the callback if needed.
    const onCompleteAll = request.onCompleteAll;
    onCompleteAll();
  }
}

function retryTask(request, task) {
  const segment = task.blockedSegment;

  if (segment.status !== PENDING) {
    // We completed this by other means before we had a chance to retry it.
    return;
  } // We restore the context to what it was when we suspended.
  // We don't restore it after we leave because it's likely that we'll end up
  // needing a very similar context soon again.


  switchContext(task.context);

  try {
    // We call the destructive form that mutates this task. That way if something
    // suspends again, we can reuse the same task instead of spawning a new one.
    renderNodeDestructive(request, task, task.node);
    task.abortSet.delete(task);
    segment.status = COMPLETED;
    finishedTask(request, task.blockedBoundary, segment);
  } catch (x) {
    resetHooksState();

    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = task.ping;
      x.then(ping, ping);
    } else {
      task.abortSet.delete(task);
      segment.status = ERRORED;
      erroredTask(request, task.blockedBoundary, segment, x);
    }
  } finally {
  }
}

function performWork(request) {
  if (request.status === CLOSED) {
    return;
  }

  const prevContext = getActiveContext();
  const prevDispatcher = ReactCurrentDispatcher$1.current;
  ReactCurrentDispatcher$1.current = Dispatcher;

  const prevResponseState = currentResponseState;
  setCurrentResponseState(request.responseState);

  try {
    const pingedTasks = request.pingedTasks;
    let i;

    for (i = 0; i < pingedTasks.length; i++) {
      const task = pingedTasks[i];
      retryTask(request, task);
    }

    pingedTasks.splice(0, i);

    if (request.status === FLOWING) {
      flushCompletedQueues(request);
    }
  } catch (error) {
    reportError(request, error);
    fatalError(request, error);
  } finally {
    setCurrentResponseState(prevResponseState);
    ReactCurrentDispatcher$1.current = prevDispatcher;

    if (prevDispatcher === Dispatcher) {
      // This means that we were in a reentrant work loop. This could happen
      // in a renderer that supports synchronous work like renderToString,
      // when it's called from within another renderer.
      // Normally we don't bother switching the contexts to their root/default
      // values when leaving because we'll likely need the same or similar
      // context again. However, when we're inside a synchronous loop like this
      // we'll to restore the context to what it was before returning.
      switchContext(prevContext);
    }
  }
}

function flushSubtree(request, destination, segment) {
  segment.parentFlushed = true;

  switch (segment.status) {
    case PENDING:
      {
        // We're emitting a placeholder for this segment to be filled in later.
        // Therefore we'll need to assign it an ID - to refer to it by.
        const segmentID = segment.id = request.nextSegmentId++;
        return writePlaceholder(destination, request.responseState, segmentID);
      }

    case COMPLETED:
      {
        segment.status = FLUSHED;
        let r = true;
        const chunks = segment.chunks;
        let chunkIdx = 0;
        const children = segment.children;

        for (let childIdx = 0; childIdx < children.length; childIdx++) {
          const nextChild = children[childIdx]; // Write all the chunks up until the next child.

          for (; chunkIdx < nextChild.index; chunkIdx++) {
            writeChunk(destination, chunks[chunkIdx]);
          }

          r = flushSegment(request, destination, nextChild);
        } // Finally just write all the remaining chunks


        for (; chunkIdx < chunks.length; chunkIdx++) {
          r = writeChunk(destination, chunks[chunkIdx]);
        }

        return r;
      }

    default:
      {
        {
          {
            throw Error( formatProdErrorMessage(390));
          }
        }
      }
  }
}

function flushSegment(request, destination, segment) {
  const boundary = segment.boundary;

  if (boundary === null) {
    // Not a suspense boundary.
    return flushSubtree(request, destination, segment);
  }

  boundary.parentFlushed = true; // This segment is a Suspense boundary. We need to decide whether to
  // emit the content or the fallback now.

  if (boundary.forceClientRender) {
    // Emit a client rendered suspense boundary wrapper.
    // We never queue the inner boundary so we'll never emit its content or partial segments.
    writeStartClientRenderedSuspenseBoundary(destination, request.responseState, boundary.id); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndClientRenderedSuspenseBoundary(destination, request.responseState);
  } else if (boundary.pendingTasks > 0) {
    // This boundary is still loading. Emit a pending suspense boundary wrapper.
    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;

    if (boundary.completedSegments.length > 0) {
      // If this is at least partially complete, we can queue it to be partially emitted early.
      request.partialBoundaries.push(boundary);
    }

    writeStartPendingSuspenseBoundary(destination, request.responseState, boundary.id); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else if (boundary.byteSize > request.progressiveChunkSize) {
    // This boundary is large and will be emitted separately so that we can progressively show
    // other content. We add it to the queue during the flush because we have to ensure that
    // the parent flushes first so that there's something to inject it into.
    // We also have to make sure that it's emitted into the queue in a deterministic slot.
    // I.e. we can't insert it here when it completes.
    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;
    request.completedBoundaries.push(boundary); // Emit a pending rendered suspense boundary wrapper.

    writeStartPendingSuspenseBoundary(destination, request.responseState, boundary.id); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else {
    // We can inline this boundary's content as a complete boundary.
    writeStartCompletedSuspenseBoundary(destination, request.responseState, boundary.id);
    const completedSegments = boundary.completedSegments;

    if (!(completedSegments.length === 1)) {
      {
        throw Error( formatProdErrorMessage(391));
      }
    }

    const contentSegment = completedSegments[0];
    flushSegment(request, destination, contentSegment);
    return writeEndCompletedSuspenseBoundary(destination, request.responseState);
  }
}

function flushClientRenderedBoundary(request, destination, boundary) {
  return writeClientRenderBoundaryInstruction(destination, request.responseState, boundary.id);
}

function flushSegmentContainer(request, destination, segment) {
  writeStartSegment(destination, request.responseState, segment.formatContext, segment.id);
  flushSegment(request, destination, segment);
  return writeEndSegment(destination, segment.formatContext);
}

function flushCompletedBoundary(request, destination, boundary) {
  const completedSegments = boundary.completedSegments;
  let i = 0;

  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];
    flushPartiallyCompletedSegment(request, destination, boundary, segment);
  }

  completedSegments.length = 0;
  return writeCompletedBoundaryInstruction(destination, request.responseState, boundary.id, boundary.rootSegmentID);
}

function flushPartialBoundary(request, destination, boundary) {
  const completedSegments = boundary.completedSegments;
  let i = 0;

  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];

    if (!flushPartiallyCompletedSegment(request, destination, boundary, segment)) {
      i++;
      completedSegments.splice(0, i); // Only write as much as the buffer wants. Something higher priority
      // might want to write later.

      return false;
    }
  }

  completedSegments.splice(0, i);
  return true;
}

function flushPartiallyCompletedSegment(request, destination, boundary, segment) {
  if (segment.status === FLUSHED) {
    // We've already flushed this inline.
    return true;
  }

  const segmentID = segment.id;

  if (segmentID === -1) {
    // This segment wasn't previously referred to. This happens at the root of
    // a boundary. We make kind of a leap here and assume this is the root.
    const rootSegmentID = segment.id = boundary.rootSegmentID;

    if (!(rootSegmentID !== -1)) {
      {
        throw Error( formatProdErrorMessage(392));
      }
    }

    return flushSegmentContainer(request, destination, segment);
  } else {
    flushSegmentContainer(request, destination, segment);
    return writeCompletedSegmentInstruction(destination, request.responseState, segmentID);
  }
}

let reentrant = false;

function flushCompletedQueues(request) {
  if (reentrant) {
    return;
  }

  reentrant = true;
  const destination = request.destination;

  try {
    // The structure of this is to go through each queue one by one and write
    // until the sink tells us to stop. When we should stop, we still finish writing
    // that item fully and then yield. At that point we remove the already completed
    // items up until the point we completed them.
    // TODO: Emit preloading.
    // TODO: It's kind of unfortunate to keep checking this array after we've already
    // emitted the root.
    const completedRootSegment = request.completedRootSegment;

    if (completedRootSegment !== null && request.pendingRootTasks === 0) {
      flushSegment(request, destination, completedRootSegment);
      request.completedRootSegment = null;
    } // We emit client rendering instructions for already emitted boundaries first.
    // This is so that we can signal to the client to start client rendering them as
    // soon as possible.


    const clientRenderedBoundaries = request.clientRenderedBoundaries;
    let i;

    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      const boundary = clientRenderedBoundaries[i];

      if (!flushClientRenderedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        clientRenderedBoundaries.splice(0, i);
        return;
      }
    }

    clientRenderedBoundaries.splice(0, i); // Next we emit any complete boundaries. It's better to favor boundaries
    // that are completely done since we can actually show them, than it is to emit
    // any individual segments from a partially complete boundary.

    const completedBoundaries = request.completedBoundaries;

    for (i = 0; i < completedBoundaries.length; i++) {
      const boundary = completedBoundaries[i];

      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        completedBoundaries.splice(0, i);
        return;
      }
    }

    completedBoundaries.splice(0, i); // Allow anything written so far to flush to the underlying sink before
    // we continue with lower priorities.

    completeWriting(destination);
    beginWriting(destination); // TODO: Here we'll emit data used by hydration.
    // Next we emit any segments of any boundaries that are partially complete
    // but not deeply complete.

    const partialBoundaries = request.partialBoundaries;

    for (i = 0; i < partialBoundaries.length; i++) {
      const boundary = partialBoundaries[i];

      if (!flushPartialBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        partialBoundaries.splice(0, i);
        return;
      }
    }

    partialBoundaries.splice(0, i); // Next we check the completed boundaries again. This may have had
    // boundaries added to it in case they were too larged to be inlined.
    // New ones might be added in this loop.

    const largeBoundaries = request.completedBoundaries;

    for (i = 0; i < largeBoundaries.length; i++) {
      const boundary = largeBoundaries[i];

      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.status = BUFFERING;
        i++;
        largeBoundaries.splice(0, i);
        return;
      }
    }

    largeBoundaries.splice(0, i);
  } finally {
    reentrant = false;

    if (request.allPendingTasks === 0 && request.pingedTasks.length === 0 && request.clientRenderedBoundaries.length === 0 && request.completedBoundaries.length === 0 // We don't need to check any partially completed segments because
    // either they have pending task or they're complete.
    ) {


        close(destination);
      }
  }
}
function startFlowing(request) {
  if (request.status === CLOSED) {
    return;
  }

  request.status = FLOWING;

  try {
    flushCompletedQueues(request);
  } catch (error) {
    reportError(request, error);
    fatalError(request, error);
  }
} // This is called to early terminate a request. It puts all pending boundaries in client rendered state.

function abort(request) {
  try {
    const abortableTasks = request.abortableTasks;
    abortableTasks.forEach(abortTask, request);
    abortableTasks.clear();

    if (request.status === FLOWING) {
      flushCompletedQueues(request);
    }
  } catch (error) {
    reportError(request, error);
    fatalError(request, error);
  }
}

function renderToStream(children, options) {
  const destination = {
    buffer: '',
    done: false,
    fatal: false,
    error: null
  };
  const request = createRequest(children, destination, createResponseState(options ? options.identifierPrefix : undefined), createRootFormatContext(undefined), options ? options.progressiveChunkSize : undefined, options.onError, undefined, undefined);

  if (destination.fatal) {
    throw destination.error;
  }

  return {
    destination,
    request
  };
}

function abortStream(stream) {
  abort(stream.request);
}

function renderNextChunk(stream) {
  const request = stream.request,
        destination = stream.destination;
  performWork(request);
  startFlowing(request);

  if (destination.fatal) {
    throw destination.error;
  }

  const chunk = destination.buffer;
  destination.buffer = '';
  return chunk;
}

function hasFinished(stream) {
  return stream.destination.done;
}

exports.abortStream = abortStream;
exports.hasFinished = hasFinished;
exports.renderNextChunk = renderNextChunk;
exports.renderToStream = renderToStream;
//# sourceMappingURL=ReactDOMServer-prod.js.map
