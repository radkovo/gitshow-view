export class Presentation {

    apiClient = null;
    rootFolderData = [];
    templateFolderData = [];
    status = {};
    config = {};
    template = {};
    baseUrl = null;

    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    getStatus() {
        return this.status;
    }

    getFolderData() {
        return this.rootFolderData;
    }

    async refreshFolder() {
        try {
            this.rootFolderData = await this.apiClient.getFileList();
            this.templateFolderData = await this.apiClient.getFileList('template');
            this.status = this.checkPresentationHealth(this.rootFolderData);
        } catch (e) {
            let url = this.apiClient.getSourceUrl();
            this.status = { ok: false, code: 404, message: `Presentation data not found in the referenced repository<br><a href="${url}">${url}</code>` };
        }
        if (this.status.ok) {
            this.baseUrl = this.detectBaseUrl();
            console.log('BASE = ' + this.baseUrl);
            this.config = await this.readConfig();
            this.template = await this.readTemplateDefinition();
        }
    }

    checkPresentationHealth() {
        // must contain presentation.json
        const pconfig = this.getConfigFile();
        if (!pconfig) {
            return { ok: false, message: 'The source folder does not contain the presentation.json file' }
        }
        // TODO check template and contents
        // all ok
        return  { ok: true, message: 'Presentation ok' }
    }

    getFileData(name) {
        return this.getFileByName(this.rootFolderData, name);
    }

    getConfigFile() {
        return this.getFileData('presentation.json');
    }

    getFileByName(folderData, name) {
        for (let file of folderData) {
            if (file.name === name) {
                return file;
            }
        }
        return null;
    }

    async readFile(fname) {
        return await this.apiClient.getFile(fname);
    }

    detectBaseUrl() {
        const configFile = this.getConfigFile();
        if (configFile) {
            const url = configFile.download_url;
            return url.substring(0, url.length - 'presentation.json'.length);
        }
    }

    async readConfig() {
        const configFile = this.getConfigFile();
        if (configFile) {
            const configData = await this.readFile(configFile.name)
            if (configData && configData.content) {
                return JSON.parse(configData.content);
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    getConfig() {
        return this.config;
    }

    async getMarkdownContent() {
        let ret = [];
        for (let fname of this.config.contents) {
            const file = await this.readFile(fname);
            ret.push(file);
        }
        return ret;
    }

    // ===========================================================================================

    async readTemplateDefinition() {
        const data = await this.readFile('template/template.json');
        if (data && data.content) {
            let ret = JSON.parse(data.content);
            if (this.config.template?.properties) {
                ret = this.replacePlaceholders(ret, this.config.template.properties);
            }
            return ret;
        } else {
            return null;
        }
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


}