const url = "https://script.google.com/macros/s/AKfycbxAjktMA76CUG0l-kCOMuazdLrWt6ULfv6cwhlL-QuGiwhtVJx8Sb12tkOHyXqk48tl/exec?action=dashboard_data";
fetch(url)
  .then(res => res.json())
  .then(json => {
    console.log("Keys:", Object.keys(json));
    if (json.karyawan) console.log("Karyawan length:", json.karyawan.length);
    if (json.users) console.log("Users length:", json.users.length);
    if (json.karyawan && json.karyawan.length > 0) console.log("Karyawan sample:", json.karyawan[0]);
    if (json.users && json.users.length > 0) console.log("Users sample:", json.users[0]);
  })
  .catch(err => console.error(err));
