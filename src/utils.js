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

export {
  formatRelativeTime,
  formatDate,
  formatTime,
  truncateString
}