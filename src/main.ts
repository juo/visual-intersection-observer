interface Rect {
    top: number,
    right: number,
    bottom: number,
    left: number,
    width: number,
    height: number,
}

function getRootRect() {
    const html = document.documentElement;
    const body = document.body;

    return {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight,
    };
}

function getVisualRect() {
    return {
        top: window.visualViewport.offsetTop,
        right: window.visualViewport.offsetLeft + window.visualViewport.width,
        bottom: window.visualViewport.offsetTop + window.visualViewport.height,
        left: window.visualViewport.offsetLeft,
        width: window.visualViewport.width,
        height: window.visualViewport.height,
    };
}

function parseMargins(margin: string): string {
    let [top, right, bottom, left] = margin.split(/\s+/);

    if (right == null) {
        right = top;
    }

    if (bottom == null) {
        bottom = top;
    }

    if (left == null) {
        left = right;
    }

    return [top, right, bottom, left].join(' ');
}

function expandRectByRootMargin(rect: Rect, rootMargin: string) {
    var margins = parseMargins(rootMargin).split(' ').map((margin, index) => {
        if (/px$/.test(margin)) {
            return parseFloat(margin);
        }

        if (/%$/.test(margin)) {
            return parseFloat(margin) * (index % 2 ? rect.width : rect.height) / 100;
        }

        throw new Error('Only px or % is allowed in rootMargin');
    });

    const newRect: Rect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3],
      width: 0,
      height: 0,
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
  };

function parseRootMargin(rootMargin: string): string {
    const rect = expandRectByRootMargin(getVisualRect(), rootMargin);
    const rootRect = getRootRect();

    const visualMargins = [
        rootRect.top - rect.top,
        rect.right - rootRect.right,
        rect.bottom - rootRect.bottom,
        rootRect.left - rect.left,
    ];

    return visualMargins.map((margin) => `${margin}px`).join(' ');
}

type VisualIntersectionObserverInit = {
    [K in keyof IntersectionObserverInit]:
        K extends 'root' ?
        (IntersectionObserverInit[K]|VisualViewport) :
        IntersectionObserverInit[K];
}

export class VisualIntersectionObserver implements IntersectionObserver {
    #cb: IntersectionObserverCallback;
    #options?: VisualIntersectionObserverInit;
    #ob: IntersectionObserver;

    #targets = new Set<Element>();

    constructor(cb: IntersectionObserverCallback, options?: VisualIntersectionObserverInit) {
        this.#cb = cb;
        this.#options = options;
        this.#ob = this.#createObserver();

        // TODO: optimize
        window.visualViewport.addEventListener('resize', this.#updateViewport.bind(this));
        window.visualViewport.addEventListener('scroll', this.#updateViewport.bind(this));
    }

    #createObserver(): IntersectionObserver {
        const options = this.#options == null ? {} : { ...this.#options };

        if (options.root instanceof VisualViewport) {
            options.rootMargin = parseRootMargin(
                options.rootMargin == null ? '0' : options.rootMargin,
            );
            delete options.root;
        }

        return new IntersectionObserver(this.#cb, options as IntersectionObserverInit);
    }

    #updateViewport(): void {
        this.#cb(this.#ob.takeRecords(), this);
        this.#ob.disconnect();
        this.#ob = this.#createObserver();
        this.#targets.forEach((target) => this.#ob.observe(target));
    }

    get root(): Element | Document | null {
        return this.#ob.root;
    }

    get rootMargin(): string {
        return this.#ob.rootMargin;
    }

    get thresholds(): ReadonlyArray<number> {
        return this.#ob.thresholds;
    }

    disconnect(): void {
        // TODO: remove listeneres
        this.#targets.clear();
        this.#ob.disconnect();
    }

    observe(target: Element): void {
        this.#targets.add(target);
        this.#ob.observe(target);
    }

    takeRecords(): IntersectionObserverEntry[] {
        return this.#ob.takeRecords();
    }

    unobserve(target: Element): void {
        this.#targets.delete(target);
        this.#ob.unobserve(target);
    }
}
