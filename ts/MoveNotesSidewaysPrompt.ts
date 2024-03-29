/*
Copyright (C) 2019 John Nesky

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
of the Software, and to permit persons to whom the Software is furnished to do 
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*/

/// <reference path="synth.ts" />
/// <reference path="html.ts" />
/// <reference path="SongDocument.ts" />
/// <reference path="Prompt.ts" />
/// <reference path="changes.ts" />

namespace beepbox {
	const {button, div, span, h2, input, br, select, option} = HTML;
	
	export class MoveNotesSidewaysPrompt implements Prompt {
		private readonly _beatsStepper: HTMLInputElement = input({style: "width: 3em; margin-left: 1em;", type: "number", step: "0.01", value: "0"});
		private readonly _conversionStrategySelect: HTMLSelectElement = select({style: "width: 100%;"},
			option({value: "overflow"}, "Overflow notes across bars."),
			option({value: "wrapAround"}, "Wrap notes around within bars."),
		);
		private readonly _cancelButton: HTMLButtonElement = button({className: "cancelButton"});
		private readonly _okayButton: HTMLButtonElement = button({className: "okayButton", style: "width:45%;"}, "Okay");
		
		public readonly container: HTMLDivElement = div({className: "prompt noSelection", style: "width: 250px;"},
			h2("Move Notes Sideways"),
			div({style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;"},
				div({style: "text-align: right;"},
					"Beats to move:",
					br(),
					span({style: "font-size: smaller; color: #888888;"}, "(Negative is left, positive is right)"),
				),
				this._beatsStepper,
			),
			div({style: "display: flex; flex-direction: row; align-items: center; height: 2em; justify-content: flex-end;"},
				div({className: "selectContainer", style: "width: 100%;"}, this._conversionStrategySelect),
			),
			div({style: "display: flex; flex-direction: row-reverse; justify-content: space-between;"},
				this._okayButton,
			),
			this._cancelButton,
		);
		
		constructor(private _doc: SongDocument, private _songEditor: SongEditor) {
			this._beatsStepper.min = (-this._doc.song.beatsPerBar) + "";
			this._beatsStepper.max = this._doc.song.beatsPerBar + "";
			
			const lastStrategy: string | null = window.localStorage.getItem("moveNotesSidewaysStrategy");
			if (lastStrategy != null) {
				this._conversionStrategySelect.value = lastStrategy;
			}
			
			this._beatsStepper.select();
			setTimeout(()=>this._beatsStepper.focus());
			
			this._okayButton.addEventListener("click", this._saveChanges);
			this._cancelButton.addEventListener("click", this._close);
			this._beatsStepper.addEventListener("blur", MoveNotesSidewaysPrompt._validateNumber);
			this.container.addEventListener("keydown", this._whenKeyPressed);
		}
		
		private _close = (): void => { 
			this._doc.undo();
		}
		
		public cleanUp = (): void => { 
			this._okayButton.removeEventListener("click", this._saveChanges);
			this._cancelButton.removeEventListener("click", this._close);
			this._beatsStepper.removeEventListener("blur", MoveNotesSidewaysPrompt._validateNumber);
			this.container.removeEventListener("keydown", this._whenKeyPressed);
		}
		
		private _whenKeyPressed = (event: KeyboardEvent): void => {
			if ((<Element> event.target).tagName != "BUTTON" && event.keyCode == 13) { // Enter key
				this._saveChanges();
			}
		}
		
		private static _validateNumber(event: Event): void {
			const input: HTMLInputElement = <HTMLInputElement>event.target;
			let value: number = +input.value;
			value = Math.round(value * Config.partsPerBeat) / Config.partsPerBeat;
			value = Math.round(value * 100) / 100;
			input.value = Math.max(+input.min, Math.min(+input.max, value)) + "";
		}
		
		private _saveChanges = (): void => {
			window.localStorage.setItem("moveNotesSidewaysStrategy", this._conversionStrategySelect.value);
			this._doc.prompt = null;
			this._doc.record(new ChangeMoveNotesSideways(this._doc, +this._beatsStepper.value, this._conversionStrategySelect.value), true);
		}
	}
}
