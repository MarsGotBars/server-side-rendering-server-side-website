import express from "express";
import { Liquid } from "liquidjs";

let taskData = [];
let exerciseData = [];
const fetchThemedTask = async () => {
  const taskList = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_task"
  );
  // Skip hiermee het benoemen van 'data'
  const { data: taskListJson } = await taskList.json();
  taskData = taskListJson;
};

const fetchThemedExercise = async () => {
  const exerciseList = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_exercise"
  );
  // Skip hiermee het benoemen van 'data'
  const { data: exerciseListJson } = await exerciseList.json();
  // Refresh de data voor de check
  exerciseData = exerciseListJson;
};

(async () => {
  await fetchThemedExercise();
  await fetchThemedTask();
})();
const app = express();

app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());

app.set("views", "./views");

app.get("/", async function (request, response) {
  response.render("index.liquid");
});

// Dynamische parameter om te gebruiken bij het vinden van de correcte taskData
app.get("/:theme", async function (request, response) {
  // Custom lijst met alle task titles en pathNames
  const tasks = taskData.map((task) => ({
    title: task.title,
    pathName: task.theme,
    id: task.id,
  }));

  // Sla deze op voor leesbaarheid
  const requestedTheme = request.params.theme;

  // Zoek taskData dmv de gevraagde :theme
  const foundData = taskData.find((data) => data.theme === requestedTheme);

  if (!foundData) {
    return response.status(404).render("err.liquid");
  }

  // Destructureer om props makkelijk door te
  const { pathName, theme, title, id, exercise: exerciseList } = foundData;

  const exerciseInfo = exerciseList.map((exercise) => {
    return exerciseData.find((e) => e.id === exercise);
  });
  const exercises = exerciseInfo.map((exercise) => {
    return {
      ...exercise,
      // absoluut pad, altijd handig -Krijn
      pathName: `/${pathName}/${exercise.id}`,
    };
  });

  // respond met de gevraagde pagina & het behorende thema
  response.render(`task.liquid`, {
    theme,
    title,
    id,
    tasks,
    exercises,
  });
});

app.get("/:theme/:pageId", async function (request, response) {
  const { theme, pageId } = request.params;
  const foundData = taskData.find((data) => data.theme === theme);

  // - 1 omdat we door een array lopend die start op 0
  const exercise = exerciseData.find(
    (exercise) => exercise.id === foundData.exercise[pageId - 1]
  );
  if (!exercise) {
    return response.status(404).render("err.liquid");
  }
  const { title, description, image } = exercise;
  const { foundtheme, id } = foundData;
  response.render(`exercise.liquid`, {
    foundtheme,
    title,
    description,
    id,
    image,
  });
});

app.post("/", async function (request, response) {
  response.redirect(303, "/");
});

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), function () {
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
