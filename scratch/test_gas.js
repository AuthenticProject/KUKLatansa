const url = "https://script.google.com/macros/s/AKfycbxAjktMA76CUG0l-kCOMuazdLrWt6ULfv6cwhlL-QuGiwhtVJx8Sb12tkOHyXqk48tl/exec?action=dashboard_data";
fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("Status:", text.substring(0, 500));
  })
  .catch(err => console.error(err));
