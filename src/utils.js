import moment from "moment";

const formatRelativeTime = (time) => {
  if (!time) return "N/A";
  
  var now = moment(new Date()); //todays date
  var end = moment(time); // another date
  var duration = moment.duration(now.diff(end));
  var days = duration.asDays();

  if (days < 2) {
    return moment(time).fromNow();
  } else {
    return moment(time).format('MMM Do YYYY');
  }
};

const formatDate = (date) => {
  return moment(date).format('MMM Do YYYY');
};

const formatTime = (time) => {
  return moment(time, 'HH:mm:ss').format('hh:mm a');
};

function truncateString(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}

function randDarkColor() {
  const lum = -0.25;
  let hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let rgb = "#",
    c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }
  return rgb;
}

function makeColorGenerator() {
  const db = {};
  return function (key) {
    if (!db[key]) {
      db[key] = "#000000".replace(/0/g, () => (~~(Math.random() * 16)).toString(16));
    }
    return db[key];
  }
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

function getInvertColor(hex, bw=1) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export {
  formatRelativeTime,
  formatDate,
  formatTime,
  truncateString,
  makeColorGenerator,
  getInvertColor,
  numberWithCommas
}