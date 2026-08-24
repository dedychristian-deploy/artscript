const express = require("express");
const cors = require("cors");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const app = express();
const PORT = 1920;

const VDF_CONTENT_TYPE = "application/vnd.vizrt.payload+xml";

app.use(cors());
app.use(express.text({ type: "*/*" }));

// Nilai override dari LIVEBOX.
// null = jangan override payload MSE.
let pendingSetBoxes = null;


// ============================================================
// 1. LIVEBOX KIRIM SetBoxes HASIL EDIT / DELETE
// ============================================================

app.post("/set-boxes", (req, res) => {

    const value = parseInt(req.body, 10);

    if (Number.isNaN(value)) {
        return res.status(400).json({
            ok: false,
            error: "Invalid SetBoxes"
        });
    }

    pendingSetBoxes = value;

    console.log("LIVEBOX SetBoxes override:", pendingSetBoxes);

    res.json({
        ok: true,
        SetBoxes: pendingSetBoxes
    });
});


// ============================================================
// 2. MSE EXTERNAL UPDATE SERVICE
// ============================================================

const parser = new XMLParser({
    ignoreAttributes: false
});

const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true
});


function replaceSetBoxes(node) {

    if (!node || typeof node !== "object")
        return;

    if (node.field) {

        const fields = Array.isArray(node.field)
            ? node.field
            : [node.field];

        for (const field of fields) {

            if (
                //field["@_name"] &&
                field["@_name"] === "SetBoxes"
            ) {

                console.log(
                    "MSE original SetBoxes:",
                    field.value
                );

if (pendingSetBoxes !== null) {

    field.value = String(pendingSetBoxes);

    console.log(
        "MSE override SetBoxes:",
        field.value
    );

    pendingSetBoxes = null;
    console.log("SetBoxes override consumed");
}
            }
        }
    }

    for (const value of Object.values(node)) {
        replaceSetBoxes(value);
    }
}


app.post("/update-template", (req, res) => {

    try {

        console.log("\n==============================");
        console.log("UPDATE SERVICE CALLED BY MSE");
        console.log("==============================");

        console.log("\nFROM MSE:");
        console.log(req.body);

        const payload = parser.parse(req.body);

        replaceSetBoxes(payload);

        const updatedXml = builder.build(payload);

        console.log("\nRETURN TO MSE:");
        console.log(updatedXml);

        res
            .status(200)
            .type(VDF_CONTENT_TYPE)
            .send(updatedXml);

    }
    catch (err) {

        console.error("UPDATE SERVICE ERROR:", err);

        res.status(500).send(err.message);
    }

});

app.post("/clear-set-boxes", (req, res) => {
    pendingSetBoxes = null;

    console.log("LIVEBOX SetBoxes override CLEARED");

    res.json({
        ok: true
    });
});


app.listen(PORT, "0.0.0.0", () => {
    console.log(`External Update Service running on port ${PORT}`);
});