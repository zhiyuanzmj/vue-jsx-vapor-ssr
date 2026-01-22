import HelloWorld from "./components/HelloWorld";
import vueLogo from "./assets/vue.svg";
import { defineVaporComponent } from "vue";

export default defineVaporComponent(() => {
  return (
    <div>
      <a href="https://vite.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src={vueLogo} class="logo vue" alt="Vue logo" />
      </a>
      <HelloWorld msg="Vite + Vue JSX Vapor" />
    </div>
  );

  defineStyle(`
    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.vue:hover {
      filter: drop-shadow(0 0 2em #42b883aa);
    }
  `);
});
