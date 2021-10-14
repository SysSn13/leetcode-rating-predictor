var preference = JSON.parse(localStorage.getItem("dark"));
if (preference === null) {
  localStorage.setItem("dark", false);
  preference=false;
}
var checkBox = document.getElementById("checkDark");
if(checkBox){
  checkBox.checked = preference;
}
const html = document.getElementsByTagName("html")[0];

if (preference) {
  html.style.filter = "invert(0.9) hue-rotate(150deg)";
} else {
  html.style.filter = "";
}

function toggle_darkmode() {
  preference = !preference;
  checkBox.checked = preference;
  localStorage.setItem("dark", preference);

  if (preference) {
    html.style.filter = "invert(0.9) hue-rotate(150deg)";
  } else {
    html.style.filter = "";
  }
}
