Element.prototype.show = function(cond) {
  this.style.visibility = (cond === false)? 'hidden' : '';
}
Element.prototype.hide = function(cond) {
  this.style.visibility = (cond === false)? '' : 'hidden';
}
Element.prototype.setColor = function(color) {
  this.style.backgroundColor = color;
  setStateStyles(this);
}

function hideAll() {
  $('p, button').toArray().forEach(el => el.hide(el.style.display != 'none'));
}

function $id(id) {
  return document.getElementById(id);
}

class TooltipElement extends HTMLElement {
  constructor() {
      super();
  }
}

customElements.define('tool-tip', TooltipElement);

function updateDisplay(name, label) {
  $id(name + 'Display').innerHTML = label;
}

const displayExp = new RegExp('Display$');
function getDisplayTypes() {
  return $('*').toArray().filter(el => displayExp.test(el.id)).map(el => el.id.slice(0, -7));
}

const min = Math.min;
const max = Math.max;
function mod(x, n) {
    return x - n * Math.floor(x / n);
}

function darken(color) {
    let hsv = rgbToHsv(color[0], color[1], color[2]);
    // Not yellow
    if (hsv[0] < 0.162 || hsv[0] > 0.170) {
        let relHue = mod(hsv[0] - 1/6, 1) - 0.5;
        hsv[0] = (Math.sign(relHue) * max(0, (Math.abs(relHue) - 3/360)) + 0.5 + 1/6) % 1;
    }
    // Not monochromatic
    if (hsv[1] >= 0.02) {
        hsv[1] = min(1, hsv[1] + 0.07);
    } else {
        hsv[2] -= 0.06;
    }
    hsv[2] = max(0, hsv[2] - 0.03);
    return hsvToRgb(hsv[0], hsv[1], hsv[2]);
}



var autoStyle;
var buttonNodes = {};

function rgbString(levels) {
  if (levels.length == 4) return `rgba(${levels[0]}, ${levels[1]}, ${levels[2]}, ${levels[3]})`
  return `rgb(${levels[0]}, ${levels[1]}, ${levels[2]})`;
}

function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
  
    var rmax = max(r, g, b), rmin = min(r, g, b);
    var h, s, v = rmax;
  
    var d = rmax - rmin;
    s = rmax == 0 ? 0 : d / rmax;
  
    if (rmax == rmin) {
      h = 0; // achromatic
    } else {
      switch (rmax) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
  
      h /= 6;
    }
  
    return [ h, s, v ];
  }

function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [ r * 255, g * 255, b * 255 ];
}

// Update button pseudo-class styles using new BG color
function updateButtonPseudo(textNode, id, color) {
    let hoverColor = darken(color);
    let activeColor = darken(hoverColor);
    let disableColor = [88, 88, 88, 0.64];
    textNode.nodeValue = `#${id}{background-color:${rgbString(color)}}#${id}:hover{background-color:${rgbString(hoverColor)}}#${id}:active{background-color:${rgbString(activeColor)}}#${id}:disabled{background-color:${rgbString(disableColor)}}`;
}

function setStateStyles(button) {
    let color = window.getComputedStyle(button).getPropertyValue("background-color");
    button.style.removeProperty("background-color");  // remove inlined
    if (button.color == color) return;  // nothing changed
    button.color = color;

    color = color.replace(/[^\d,]/g, '').split(',');
    color[0] = Number(color[0]);
    color[1] = Number(color[1]);
    color[2] = Number(color[2]);
    if (!buttonNodes[button.id]) {
        buttonNodes[button.id] = document.createTextNode('');
        autoStyle.appendChild(buttonNodes[button.id]);
    }
    if (!button.id) console.log("Error: Need to generate temp ids for some buttons")
    updateButtonPseudo(buttonNodes[button.id], button.id, color);
}

function initStyle() {
    autoStyle = document.createElement('style');
    document.head.appendChild(autoStyle);
}