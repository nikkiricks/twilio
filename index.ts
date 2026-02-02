import { createApp } from "./src/app.js";

const PORT = 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Your server is running on port ${PORT}`);
});
