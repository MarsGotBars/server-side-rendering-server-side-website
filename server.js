import express from "express";
import { Liquid } from "liquidjs";

const exerciseList = await fetch(
  "https://fdnd-agency.directus.app/items/dropandheal_exercise"
);
// Skip hiermee het benoemen van 'data'
const { data: exerciseListJson } = await exerciseList.json();

let taskData = [];

const fetchThemedTask = async () => {
  try {
    const taskList = await fetch("https://fdnd-agency.directus.app/items/dropandheal_task");
    // Skip hiermee het benoemen van 'data'
    const { data: taskListJson } = await taskList.json();

    taskData = taskListJson.map(task => {
      // in het geval dat de map fout gaat maken we deze array niet aan.
      const taskThemes = [
        { theme: "blue", pathName: "verlies-aanvaarden" },
        { theme: "red", pathName: "pijn-doorvoelen" },
        { theme: "green", pathName: "verder-verandering" },
        { theme: "purple", pathName: "emotioneel-verder" }
      ];
      // offset aangezien ids starten bij 1 en de array bij 0
      const themeIndex = task.id - 1;
      return {
        ...task,
        pathName: taskThemes[themeIndex].pathName || `missing-name-${themeIndex}`,
        theme: taskThemes[themeIndex].theme || `missing-color-${themeIndex}`,
      };
    });
    
    // Log themes after they're populated
    // console.log("Themes fetched & enhanced:", taskData);
  } catch (error) {
    console.error("Error fetching themes:", error);
  }
};

fetchThemedTask();  // Initiate the fetch operation
const app = express();

app.use(express.static("public"));

// Stel Liquid in als 'view engine'
const engine = new Liquid();
app.engine("liquid", engine.express());

// Stel de map met Liquid templates in
// Let op: de browser kan deze bestanden niet rechtstreeks laden (zoals voorheen met HTML bestanden)
app.set("views", "./views");

// Maak een GET route voor de index (meestal doe je dit in de root, als /)
app.get("/", async function (request, response) {
  // console.log({ "tasklist": taskData });

  response.render("index.liquid");
});

app.get("/:theme", async function (request, response) {
  const requestedTheme = request.params.theme
  const foundData = taskData.find(data => data.pathName === requestedTheme)
  console.log(foundData);
  
  response.render(`${foundData.pathName}.liquid`, {
    themeColor: foundData.theme
  });
});

app.post("/", async function (request, response) {
  response.redirect(303, "/");
});

// Stel het poortnummer in waar Express op moet gaan luisteren
// Lokaal is dit poort 8000, als dit ergens gehost wordt, is het waarschijnlijk poort 80
app.set("port", process.env.PORT || 8000);

// Start Express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get("port"), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
