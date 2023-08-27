import Reveal from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import RevealMath from 'reveal.js/plugin/math/math.esm.js';

import RevealRewrite from './plugin/rewrite/plugin.js';
import RevealReferences from './plugin/references/plugin.js';

//let RevealSpotlight = require('./plugin/spotlight/spotlight.js');


class GitShow {

    presentation = null;
    presentationConfig = {};
    template = null;
    main = null;
    deck = null;

    /*
        Reveal.js configuration is taken from the following sources (in the following order)
        1. The default config below
        2. Each template can update the config via updateRevealConfig()
        3. The presentation may upadte the config in the 'reveal' section of presentation.json.
    */
    revealConfig = {
        width: 1920,
        height: 1080,
        margin: 0,

        hash: true,
        center: true,
        pdfMaxPagesPerSlide: 1,
        pdfSeparateFragments: false,

        plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealMath, RevealRewrite, RevealReferences],
    };

    async init(presentation) {
        const config = presentation.getConfig();
        const templateData = JSON.stringify(presentation.template);
        this.presentationConfig = config;
        this.presentation = presentation;

        console.log('Welcome to GitShow!');
        console.log('https://github.com/radkovo/gitshow');
        console.log(this.presentationConfig);
        this.main = document.getElementById('gitshow-main');
        if (config.contents) {
            if (config.contents.length > 0) {
                await this.createContent(config.contents);
            }
            this.template = this.parseTemplate(templateData, config);
            this.useTemplate(this.template);
            if (config.reveal) {
                this.updateRevealConfig(config.reveal);
            }
            this.runReveal();
        } else {
            this.showError('Presentation config not found.');
        }
    }

    parseTemplate(templateData, config) {
        let template = JSON.parse(templateData);
        if (config.template?.properties) {
            template = this.replacePlaceholders(template, config.template.properties);
        }
        return template;
    }

    replacePlaceholders(template, properties) {
        if (typeof template === 'string') {
            let exactMatch = template.match(/\${(.*?)}/);
            if (exactMatch) { // exact match - return the property value
                return properties[exactMatch[1]] || exactMatch[0];
            } else { // replace in a string
                return template.replace(/\${(.*?)}/g, (match, propertyName) => {
                    return properties[propertyName] || match;
                });
            }
        } else if (Array.isArray(template)) {
            return template.map(item => this.replacePlaceholders(item, properties));
        } else if (typeof template === 'object' && template !== null) {
            const result = {};
            for (const key in template) {
                if (template.hasOwnProperty(key)) {
                    result[key] = this.replacePlaceholders(template[key], properties);
                }
            }
            return result;
        } else {
            return template;
        }
    }

    useTemplate(template) {
        console.log("USE");
        console.log(template);
        // use base CSS
        if (template.baseTheme) {
            this.addStyle('/css/theme/' + template.baseTheme + '.css');
        }
        // use custom styles
        if (template.styles) {
            for (let sname of template.styles) {
                this.addStyle('template/' + sname);
            }
        }
        // update reveal config
        if (template.reveal) {
            this.updateRevealConfig(template.reveal);
        }
    }

    getPresentationConfig() {
        return this.presentationConfig;
    }

    getRevealConfig() {
        return this.revealConfig;
    }

    updateRevealConfig(newConfig) {
        this.revealConfig = { ...this.revealConfig, ...newConfig };
    }

    addStyle(path) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', path);
        head.appendChild(link);
    }

    async ImportStyle(path) {

    }

    runReveal() {
        this.deck = new Reveal(this.revealConfig);
        this.deck.initialize();
    }

    async createContent(contents) {
        this.main.innerHTML = '';
        const reveal = document.createElement('div');
        reveal.setAttribute('class', 'reveal');
        this.main.appendChild(reveal);
        const slides = document.createElement('div');
        slides.setAttribute('class', 'slides');
        reveal.appendChild(slides);

        for (let cont of contents) {
            const slide = document.createElement('section');
            slide.setAttribute('data-markdown', '');
            //slide.innerHTML = '# Ahoj\nNazdar';
            slides.appendChild(slide);
            let md = await this.presentation.readFile(cont);
            let inslide = `<textarea data-template>${md.content}</textarea>`;
            slide.innerHTML = inslide;
            console.log(cont);
        }
    }

    showError(msg) {
        this.main.innerHTML = '<strong>Error:</strong> ' + msg;
    }

}

export default GitShow;
