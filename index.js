const express= require("express");
const app=express();
const PORT=3000;
app.use(express.static("public"));
app.use(express.json());
let command={
    angleS:90,
    angleE:90,
    angleH:90
}

app.get("/comando",(req,res)=>{
    res.json(command);
});

app.post("/comando", (req, res) => {

    const { angleS,
            angleE,
            angleH
    } = req.body;

    const angles = [angleS,angleE,angleH];
    if (
        !angles.every(Number.isFinite) ||
        angleS < 10 ||
        angleS > 160 ||
        angleE < 10 ||
        angleE > 160 ||
        angleH < 10 ||
        angleH > 160 
    ) {
        return res.status(400).json({
            error: "Comando invalido"
        });
    }

    command = {
        angleS,
        angleE,
        angleH
    };

    res.status(200).json({
        message: "Comando atualizado",
        comando: command
    });
});


app.listen(PORT,"0.0.0.0" ,()=>{
    console.log("Initialyzed...");
});