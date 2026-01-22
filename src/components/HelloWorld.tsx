import { ref, defineVaporComponent } from "vue";

export default defineVaporComponent((props: { msg: string }) => {
  const count = ref(1);

  return (
    <div>
      <h1>{props.msg}</h1>

      <div class="card">
        <button type="button" onClick={() => count.value++}>
          count is {count.value}
        </button>
        <p>
          Edit <code>components/HelloWorld.vue</code> to test HMR
        </p>
      </div>

      <p>
        Install{" "}
        <a href="https://github.com/ts-macro/ts-macro" target="_blank">
          TS Macro{" "}
        </a>
        in your IDE for a better DX
      </p>
      <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
    </div>
  );

  defineStyle(`
    .read-the-docs {
      color: #888;
    }
  `);
});
