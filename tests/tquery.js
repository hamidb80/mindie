function test_text_query_phrase(mdast) {
    const query = parseQuery(`[text] more info`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}

function test_text_query_range(mdast) {
    const query = parseQuery(`[text] more ... visit`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}

function test_asset_query_specific(mdast) {
    const query = parseQuery(`[asset] ./assets/test.png`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}
