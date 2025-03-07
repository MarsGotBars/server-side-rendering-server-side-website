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
      // In het geval dat de map fout gaat maken we deze array niet aan.
      const taskThemes = [
        { taskTheme: "blue", pathName: "verlies-aanvaarden" },
        { taskTheme: "red", pathName: "pijn-doorvoelen" },
        { taskTheme: "green", pathName: "verder-verandering" },
        { taskTheme: "purple", pathName: "emotioneel-verder" }
      ];

      // offset aangezien ids starten bij 1 en de array bij 0, dus -1
      const themeIndex = task.id - 1;

      // Bouw hier heb object op zoals we dat willen, met fallbacks als ik iets fout heb geschreven.
      return {
        // Alle keys die al bestaan in het object
        ...task,
        // En de keys die we zelf toevoegen
        pathName: taskThemes[themeIndex].pathName || `missing-name-${themeIndex}`,
        taskTheme: taskThemes[themeIndex].taskTheme || `missing-color-${themeIndex}`,
      };
    });    
  } catch (error) {
    console.error("Error fetching themes:", error);
  }
};

fetchThemedTask();
const app = express();

app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());

app.set("views", "./views");

app.get("/", async function (request, response) {
  response.render("index.liquid");
});

// Dynamische parameter om te gebruiken bij het vinden van de correcte taskData
app.get("/stap/:theme", async function (request, response) {
  // Custom lijst met alle task titles en pathNames
  const tasks = taskData.map(task => ({
    title: task.title,
    pathName: task.pathName,
    id: task.id
  }));
  // Sla deze op voor leesbaarheid
  const requestedTheme = request.params.theme
  // Zoek taskData dmv de gevraagde :theme
  const foundData = taskData.find(data => data.pathName === requestedTheme)
  // Destructureer om props makkelijk door te
  const {pathName,taskTheme, title, id, exercise: exerciseList} = foundData
  
  const exerciseData = exerciseList.map(exercise => {
    return exerciseListJson.find(e => e.id === exercise)
  });
  const exercises = exerciseData.map(exercise =>{
    return {
      ...exercise,
      // absoluut pad, altijd handig -Krijn
      pathName: `/stap/${pathName}/${exercise.id}`
    }
  })

  // respond met de gevraagde pagina & het behorende thema
  response.render(`task.liquid`, {
    taskTheme,
    title,
    id,
    tasks,
    exercises
  });
});

app.get("/stap/:theme/:pageId", async function (request, response) {
  const {theme, pageId} = request.params
  const foundData = taskData.find(data => data.pathName === theme)
  const exercise = exerciseListJson.find(exercise => exercise.id === parseInt(pageId))
  const {title, description} = exercise
  const {taskTheme, id} = foundData
  response.render(`exercise.liquid`, {
    taskTheme,
    title,
    description,
    id
  })
});

app.post("/", async function (request, response) {
  response.redirect(303, "/");
});

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), function () {
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
