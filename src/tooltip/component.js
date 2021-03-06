import { BaseElement } from "../base-element"
import {arrow, computePosition, flip, shift, offset, autoUpdate} from '@floating-ui/dom';

/** @extends import("../base-element").BaseElement */
export class RoleTooltip extends BaseElement {
  static get properties () {
    return ["rootElement"]
  }
  rootElementPropChanged (oldVal, newVal) {
    if (oldVal != null && newVal == null) {
      this.removeListeners()
      return
    }

    this.attachListeners()
  }

  constructor () {
    super()
    this.setAttribute("role", "tooltip")
    this._tooltipAnchors = []
    this.query = `[aria-describedby~='${this.getAttribute("id")}']`
    this.listeners = [
      ['pointerenter', this.show],
      ['pointerleave', this.hide],
      ['focusin', this.show],
      ['focusout', this.hide],
      ['keydown', this.keyboardHide],
    ]
    this.rootElement = document
  }

  /** @returns {"role-tooltip"} */
  static get baseName () {
    return "role-tooltip"
  }

  /** @returns {["id"]} */
  static get observableAttributes () {
    return ["id"]
  }

  /** @returns {string} */
  get styles () {
    return `
      :host {
        --background-color: #222;
        --arrow-size: 8px;

        display: none;
        position: absolute;
        left: 0px;
        top: 0px;
        max-width: calc(100vw - 10px);
        padding: 0.4em 0.6em;
        background: var(--background-color);
        color: white;
        border-radius: 4px;
        font-size: 0.9em;
        pointer-events: none;
        z-index: 1;
      }

      :host([hoist]) {
        position: fixed;
      }

      .arrow {
        position: absolute;
        background: var(--background-color);
        width: var(--arrow-size);
        height: var(--arrow-size);
        transform: rotate(45deg);
      }
    `
  }

  get tooltipAnchors () {
    this._tooltipAnchors = [...(this.rootElement || document).querySelectorAll(this.query)]
    return this._tooltipAnchors
  }

  /** @returns {string} */
  render () {
    return `
      <slot></slot>
      <div class="arrow" part="arrow"></div>
    `
  }

  /** @returns {string[]} */
  get observableAttributes () {
    return []
  }

  /** @returns {void} */
  connectedCallback() {
    super.connectedCallback()

    this.attachListeners()
  }

  /**
   * Fires when the "id" attribute changes.
   * @returns {void}
   */
  idChanged () {
    this.attachListeners()
  }

  /**
   * Used for re-initialized event listeners
   * @returns {void}
   */
  attachListeners () {
    this.listeners.forEach(([event, listener]) => {
      // Remove listeners. Do it in the same loop for perf stuff.
      this._tooltipAnchors.forEach((el) => el.removeEventListener(event, listener))
      this.tooltipAnchors.forEach((el) => el.addEventListener(event, listener))
    })
  }

  /*
   * Used for cleaning up
   * @returns {void}
   */
  removeListeners () {
    this.listeners.forEach(([event, listener]) => {
      this._tooltipAnchors.forEach((el) => el.removeEventListener(event, listener))
    })
  }

  /** @returns {HTMLDivElement} */
  get arrow () {
    return this.shadowQuery(".arrow")
  }

  /**
   * @param {Event|Element} eventOrElement
   * @returns {void}
   */
  show = (eventOrElement) => {
    let target = eventOrElement

    if (!(target instanceof Element)) {
      target = eventOrElement.currentTarget
    }

    this.computeTooltipPosition(target)
  }

  /**
   * @param {Event} [event]
   * @returns {void}
   */
  hide = () => {
    this.cleanup?.()
    setTimeout(() => {
      this.style.display = 'none'
    })
  }

  /**
   * @param {KeyboardEvent} event
   */
  keyboardHide = (event) => {
    if (event.key != null && event.key.toLowerCase() === "escape") {
      event.preventDefault()
      this.hide()
    }
  }

  /**
   * @param {Element} target
   * @returns {void}
   */
  computeTooltipPosition (target) {
    const arrowEl = this.arrow

    this.style.display = "block"

    this.cleanup = autoUpdate(target, this, () => {
      computePosition(target, this, {
        placement: this.getAttribute("placement") ?? "top",
        middleware: [offset(6), flip(), shift({padding: 5}), arrow({element: arrowEl})],
        strategy: this.hasAttribute("hoist") ? "fixed" : "absolute"
      }).then(({x, y, middlewareData, placement}) => {
        Object.assign(this.style, {
          left: `${x}px`,
          top: `${y}px`,
        });

        const {x: arrowX, y: arrowY} = middlewareData.arrow;
        const staticSide = {
          top: 'bottom',
          right: 'left',
          bottom: 'top',
          left: 'right',
        }[placement.split('-')[0]];

        Object.assign(arrowEl.style, {
          left: arrowX != null ? `${arrowX}px` : '',
          top: arrowY != null ? `${arrowY}px` : '',
          right: '',
          bottom: '',
          [staticSide]: '-4px',
        });
      });
    })
  }

  /** @returns {void} */
  disconnectedCallback() {
    this.removeListeners()
  }
}

