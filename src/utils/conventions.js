import YAML from "js-yaml"

// ---------------------------------------------

const YAML_PARSE_CONFIG = {
    schema: YAML.JSON_SCHEMA,
}

/**
 * @param {string} txt
 * @returns {Object}
 */
export function parseYamlAsJson(txt) {
    return YAML.load(txt, YAML_PARSE_CONFIG)
}
