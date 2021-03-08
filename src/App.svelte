<script>
  import { Screen } from 'svelte-preview-ui'
  import CodeMirror from 'codemirror'
  import 'codemirror/mode/javascript/javascript'
  import 'codemirror/mode/ruby/ruby'
  import 'codemirror/mode/htmlmixed/htmlmixed'
  import marked from 'marked'
  import {onMount, onDestroy} from 'svelte'
  import { quintInOut, elasticInOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'
  import { get, derived } from 'svelte/store'
  import { fly, fade } from 'svelte/transition'
  import * as easingFns from 'svelte/easing'

  let scrollX
  let scrollY

  let tween, cleanup
  let current = null
  let stepIndex = null
  let language = 'javascript'
  let theme = 'light'
  let code =
`function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function multiple(a, b) {
  return a * b
}

function divide(a, b) {
  return a / b
}

function double(a) {
  return multiply(a, 2)
}

function triple(a) {
  return multiply(a, 3)
}`
  let editorElement
  let editor
  let marks = []

  let steps = [
    {
      type: 'scroll',
      y: 200,
      caption: 'scrolling down',
      duration: 2000,
      pause: 500,
    },
    {
      type: 'scroll',
      y: -200,
      caption: 'scrolling up',
      pause: 500,
    },
    {
      type: 'selection',
      css: 'background: purple; color:white;',
      caption: 'selecting stuff',
      duration: 2000,
      selections: [
        {start: {line: 0, ch: 13}, end: {line: 0, ch: 14}},
        {start: {line: 1, ch: 9}, end: {line: 1, ch: 10}},
      ]
    },
    {
      type: 'selection',
      css: 'background: turquoise; color:#444;',
      selections: [
        {start: {line: 0, ch: 16}, end: {line: 0, ch: 17}},
        {start: {line: 1, ch: 13}, end: {line: 1, ch: 14}},
      ]
    },
    {
      type: 'add',
      start: {line: 2, ch: 1},
      text: '\n',
    },
    {
      type: 'add',
      caption: 'adding text',
      start: {line: 3, ch: 0},
      text: '// adding text in one shot',
    },
    {
      type: 'add',
      caption: 'adding more text',
      start: {line: 3, ch: 27},
      duration: 1000,
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 4, ch: 0},
      text: '// adding text with typewriter',
      duration: 2000,
      typewriter: true
    },
    {
      type: 'add',
      start: {line: 4, ch: 30},
      duration: 0,
      text: '\n',
    },
    {
      type: 'add',
      start: {line: 5, ch: 0},
      text: 'let syntaxHighlight = true // yay!',
      duration: 400,
      typewriter: true
    },
    {
      type: 'selection',
      start: {line: 0, ch: 0},
      end: {line: 0, ch: 8}
    },
    {
      type: 'selection',
      start: {line: 0, ch: 9},
      end: {line: 0, ch: 12}
    },
    {
      type: 'remove',
      start: {line: 0, ch: 13},
      length: 4,
      typewriter: true
    },
    {
      type: 'add',
      text: 'x, y',
      start: {line: 0, ch: 13},
      end: {line: 0, ch: 13},
      typewriter: true
    }
  ]

  code = ''
  language = 'htmlmixed'
  steps = [
    {
      type: 'add',
      text: "<script>\n</" + "script>",
      start: {line: 0, ch: 0},
      end: {line: 1, ch: 10},
      typewriter: true,
      duration: 1000,
      easing: 'elasticInOut',
      pause: 500,
      caption: 'add a **\\<script\\>** tag'
    },
    {
      type: 'add',
      text: "\n  ",
      start: {line: 0, ch: 9},
      typewriter: false,
      duration: 100,
      caption: '',
    },
    {
      type: 'add',
      text: "let name = 'Josh'",
      start: {line: 1, ch: 2},
      typewriter: true,
      duration: 200,
      easing: 'sineIn',
      pause: 500,
      caption: 'declare a **variable**'
    },
    {
      type: 'add',
      text: "\n\n",
      start: {line: 2, ch: 9},
      typewriter: true,
      duration: 100,
    },
    {
      type: 'add',
      text: "<h1>Hello {name}!</h1>",
      start: {line: 4, ch: 0},
      typewriter: true,
      duration: 200,
      easing: 'sineIn',
      pause: 500,
      caption: '**declare** a binding'
    },
    {
      type: 'add',
      text: "\n\n<style" + ">\n  h1 { color: red }\n<" + "/style>",
      start: {line: 4, ch: 23},
      typewriter: true,
      duration: 200,
      easing: 'sineIn',
      pause: 500,
      caption: '**style** the `<h1>` tag'
    },
  ]

  let jsonTimeline = JSON.stringify(steps, null, 2)

  onMount(() => {
    createEditor()
  })

  onDestroy(() => {
    if (cleanup) cleanup()
  })

  $: {
    try {
      steps = JSON.parse(jsonTimeline)
    } catch {}
  }

  $: {
    const classList = document.body.classList

    classList.remove('dark-theme', 'light-theme')
    classList.add(`${theme}-theme`)
  }

  function createEditor() {
    if (editor)
      editorElement.innerHTML = ''

    editor = CodeMirror(editorElement, {
      mode: language,
      value: code,
      smartIndent: false,
      tabSize: 2,
      electricChars: false,
      workTime: 10,
      lineNumbers: true
    })
  }

  function record() {
    if (editor.getSelection() == "")
      return

    const start = editor.getCursor(true)
    const end = editor.getCursor(false)

    steps = [...steps, {type: 'selection', start, end}]
  }

  function dispatchEvent(name, detail) {
    const event = new CustomEvent(name, {detail})
    editorElement.dispatchEvent(event)
  }

  function nextStep(index) {
    if (current) {
      dispatchEvent("stepend", current)
    }

    clearMarks()
    stepIndex = index
    current = steps[index]
    const duration = current.duration || 1000

    dispatchEvent("stepstart", current)

    switch (current.type) {
      case "scroll":
        let lastX = scrollX ? get(scrollX) : 0
        let lastY = scrollY ? get(scrollY) : 0

        scrollX = tweened(lastX, {duration, easing: elasticInOut})
        scrollY = tweened(lastY, {duration, easing: elasticInOut})

        scroll = derived([scrollX, scrollY], ([$scrollX, $scrollY], set) => {
          set({x: $scrollX, y: $scrollY})
        })

        scroll.subscribe(({x, y}) => {
          editor.scrollTo(x, y)
        })

        if (current.x) scrollX.set(current.x)
        if (current.y) scrollY.set(current.y)

        break
      case "selection":
        clearMarks()
        if (current.selections) {
          current.selections.forEach(selection => {
            editor.markText(selection.start, selection.end, {css: current.css, className: current.class})
          })
        } else  {
          editor.setSelection(current.start, current.end)

          if (current.css || current.class) {
            editor.markText(current.start, current.end, {css: current.css, className: current.class})
          }
        }
        break
      case "remove":
        const end = {line: current.start.line, ch: current.start.ch + current.length}
        editor.markText(current.start, end, {className: 'removing'})

        if (current.typewriter) {
          editor.setCursor(end)
          removeNextLetter(current, current.length)
        }
        else {
          editor.setCursor(current.start)
        }

        setTimeout(() => {
          clearMarks()
          editor.setSelection(current.start, end)
          editor.replaceSelection("")
        }, duration)
        break

      case "add":
        editor.setCursor(current.start)
        editor.setSelection(current.start)
        clearMarks()
        if (current.typewriter) {
          setupTween(current.text.length, type)
        }
        else {
          editor.replaceSelection(current.text)
          const lines = current.text.split("\n").length
          editor.markText(current.start, {ch: current.start.ch + current.text.length, line: current.start.line + lines - 1}, {className: 'adding'})
        }
        setTimeout(() => {
          clearMarks()
          editor.setCursor(editor.posFromIndex(editor.indexFromPos(current.start) + current.text.length))
        }, duration)
        break
    }

    if (index < steps.length-1) {
      const time = duration+(current.pause || 0)

      if (time > 0) {
        setTimeout(() => nextStep(index + 1), time)
      } else {
        nextStep(index+1)
      }
    } else {
      setTimeout(() => {
        if (current) dispatchEvent("stepend", current)
        stepIndex = null
        current = null
        clearMarks()
        dispatchEvent("timelineend")
      }, (duration + (current.pause || 0)))
    }
  }

  function playback() {
    marks = []
    // set starting point to original code
    editor.setValue(code)

    dispatchEvent("timelinestart")

    nextStep(0)
  }

  function setupTween(steps, fn) {
    if (cleanup) cleanup()

    const duration = (current.duration || 1000) + (current.pause||0) - 200
    const easingFn = current.easing || 'linear'
    const easing = easingFns[easingFn]
    let last = -1, index, delta

    tween = tweened(0, {duration, easing})

    cleanup = tween.subscribe(float => {
      if (float < 0) float = 0
      if (float > steps-1) float = steps-1

      index = parseInt(float)
      delta = index - last

      if (index != last) {
        fn({index, delta})
      }
      last = index
    })

    tween.set(steps-1)
  }

  function type({index, delta}) {
    if (index > current.text.length || index < 0)
      return

    clearMarks()

    let endPos

    if (delta > 0) {
      const addition = current.text.substr(index - delta + 1, delta)

      const insertPos = editor.posFromIndex(editor.indexFromPos(current.start) + index - delta + 1)
      editor.setCursor(insertPos)
      editor.replaceSelection(addition)

      endPos = editor.posFromIndex(editor.indexFromPos(current.start) + index + 1)
    } else {
      const delPos = editor.posFromIndex(editor.indexFromPos(current.start) + index - delta + 1)
      editor.setCursor(delPos)

      for (let i=0;i<-delta;i++) {
        editor.execCommand('delCharBefore')
      }
      endPos = editor.posFromIndex(editor.indexFromPos(current.start) + index + 1)
    }

    editor.markText(current.start, endPos, {className: 'adding'})
    editor.setCursor(endPos)
  }

  function removeNextLetter(step, index) {
    clearMarks()

    editor.execCommand('delCharBefore')
    editor.markText(step.start, {ch: step.start.ch + index - 1, line: step.start.line}, {className: 'removing'})

    if (index > 1) {
      setTimeout(() => removeNextLetter(step, index - 1), (step.duration || 1000)/step.length)
    }
  }

  function clearMarks() {
    editor
      .getAllMarks()
      .forEach(mark => mark.clear())
  }

  function stepStart(e) {
    console.log('step:start', e.detail)
  }
  function stepEnd(e) {
    console.log('step:end', e.detail)
  }
  function timelineStart(e) {
    console.log('timeline:start')
  }
  function timelineEnd(e) {
    console.log('timeline:end')
  }

</script>

<div class="container">
  <Screen title="Example.svelte" class="screen" contentClass="content">
    <div class="editor" bind:this={editorElement} on:stepstart={stepStart} on:stepend={stepEnd} on:timelinestart={timelineStart} on:timelineend={timelineEnd}/>
    <div class="annotation-container">
      {#key stepIndex}
        {#if current && current.caption}
          <div class="text" in:fly={{y:20, duration: 200}} out:fade={{x:40, duration: 200}}>
            {@html marked(current.caption)}
          </div>
        {/if}
      {/key}
    </div>
  </Screen>
</div>

<button on:click={record}>Record Selection</button>
<button on:click={playback} class="play">Playback</button>

<select bind:value={language} on:change={createEditor}>
  {#each ['javascript', 'ruby', 'htmlmixed'] as lang}
    <option>{lang}</option>
  {/each}
</select>

<select bind:value={theme}>
  <option>light</option>
  <option>dark</option>
</select>

<div class="timeline">
  <label>
    Steps:<br/>
    <textarea class="timeline" bind:value={jsonTimeline}/>
  </label>
</div>

<style>
  .editor {
    font-size: 1rem;
  }
  .container {
    max-width: 600px;
  }
  .annotation-container {
    display: flex;
    justify-content: center;
  }
  .annotation-container .text {
    margin-top: -40px;
    z-index: 100;
    position: absolute;
    background: #ccc;
    padding: 5px;
    border-radius: 3px;
    box-shadow: 1px 1px white;
    font-family: sans-serif;
    font-size: 0.8rem;
  }
  :global(.annotation-container .text > p) {
    margin: 0;
  }

  .timeline {
    margin-top: 5px;
    width: 100%;
    display: block;
  }

  .timeline textarea {
    min-height: 400px;
    width: 100%;
    display: block;
  }

  :global(.screen) {
    font-family: sans-serif;
  }
  :global(.content) {
    font-family: monospace;
  }
</style>
