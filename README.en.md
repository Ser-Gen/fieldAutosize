# fieldAutosize
Little pure js plugin that automatically forces a fields of forms to respect dimensions of their contents.

Plugin can understand [alternate box model](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) of element and reacts adequately.

`fieldAutosize` reacts on events `input` and `change`.

If [Mutation Observer](http://caniuse.com/#feat=mutationobserver) is supported, plugin will resize a textarea after its execution.

`fieldAutosize.active = false` will turn off autosizing.

Element with `data-fieldAutosize-disable="true"` is not processed.

If textarea is invisible on execution of plugin, then it will not be processed.

`fieldAutosize.process(selector)` finds all textareas by `selector` and resize them.
`fieldAutosize.handle(elem)` обрабатывает элемент в документе, элемент должен быть в `DOM`.
