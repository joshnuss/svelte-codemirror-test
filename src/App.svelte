<script>
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import {onMount} from 'svelte'

  const mode = 'javascript'
  const code =
`function add(a, b) {
  return a + b
}`
  let editorElement
  let editor
  let steps = []

  onMount(() => {
    editor = CodeMirror(editorElement, {
      mode,
      value: code
    })
  })

  function record() {
    if (editor.getSelection() == "")
      return

    const start = editor.getCursor(true)
    const end = editor.getCursor(false)

    steps = [...steps, {type: 'selection', start, end}]
  }

  function playback() {
    // set starting point to original code
    editor.setValue(code)

    steps.forEach((step, i) => {
      setTimeout(() => {
        if (step.type == "selection") {
          editor.setSelection(step.start, step.end)
        }
      }, i*1000)
    })

    setTimeout(() => editor.setCursor(0), steps.length * 1000)
  }
</script>

<div class="editor" bind:this={editorElement}/>

<button on:click={record}>Record Selection</button>
<button on:click={playback}>Playback</button>

<pre>steps = {JSON.stringify(steps, null, 2)}</pre>

<style>
  .editor {
    font-size: 2rem;
  }
</style>
