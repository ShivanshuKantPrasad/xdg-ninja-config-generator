const cheerio = require("cheerio");
const fs = require("node:fs/promises");

fs.readFile("XDG.html", { encoding: 'utf8' }).then(webpage => {
  const $ = cheerio.load(webpage);
  const tables = $(".wikitable");

  tables.each((tableId, table) => {
    // Tables: Supported Partial Hardcoded
    $(table).children('tbody').children('tr').each((i, app) => {
      let elem = $(app).children('td');

      if (elem.length == 0) return; // Ignore the first th header row

      // Columns: Application Legacy_Path Supported_Since Discussion Notes
      let name = $(elem[0]).text().trim();
      let paths = $(elem[1]).children();

      // a config without path is useless for xdg-ninja tool, ignore them
      if (paths.length == 0) {
        console.log(name)
        return;
      }

      // Hardcoded table doesn't contain Supported_Since column
      // Select correct column according to that
      let issue = $($(elem[tableId == 2 ? 2 : 3]).children('a')).attr('href');
      let notes = $(elem[tableId == 2 ? 3 : 4]).text().trim();

      let config = {
        name,
        files: []
      }

      paths.each((i, path) => {
        config.files.push({
          path: $(path).text().trim(),
          // Items in hardcoded table most likely dont' support moving files
          "movable": tableId != 2,
          help: `${notes}\n${issue && !issue.match("undefined") ? "_Relevant issue_: " + issue + "\n" : ""}`
        });
      });


      //Some application entries contain a slash in their name
      // For eg: iwd/iwctl or intellij-idea-community-edition/intellij-idea-ultimate-edition
      let configName = `config/${name.split('/')[0]}.json`;
      fs.writeFile(configName, JSON.stringify(config, null, 4));
    });
  });
});
