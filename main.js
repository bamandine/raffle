const { app, BrowserWindow, dialog, ipcMain} = require('electron')
const csv = require('fast-csv') 
const path = require('path')

const headersPlayers = ["numticket","nom","prenom","numtel"]
const headersWinners = headersPlayers.concat("numLot").concat("lot")

let lots = [];
let joueurs = [];

// Gardez une reference globale de l'objet window, si vous ne le faites pas, la fenetre sera
// fermee automatiquement quand l'objet JavaScript sera garbage collected.
let win

function createWindow () {
  
  // Créer le browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Émit lorsque la fenêtre est fermée.
  win.on('closed', () => {
    // Dé-référence l'objet window , normalement, vous stockeriez les fenêtres
    // dans un tableau si votre application supporte le multi-fenêtre. C'est le moment
    // où vous devez supprimer l'élément correspondant.
    win = null
  })
}

ipcMain.on('upload-joueurs',(event,arg)=> {
  if(arg=='true'){
    dialog.showOpenDialog(
      { 
        properties: ['openFile'], 
        filters: [
          { name: 'CSV obligatoire', extensions: ['csv'] }
        ]
      }, (files) => {
        callbackClickJoueurs(files);
      })   
  }
})

ipcMain.on('upload-lot',(event,arg)=> {
  if(arg=='true'){
    dialog.showOpenDialog(
      { 
        properties: ['openFile'], 
        filters: [
          { name: 'CSV obligatoire', extensions: ['csv'] }
        ]
      }, (files) => {
        callbackClickLot(files);
      })   
  }
})

ipcMain.on('do-tirage',(event,arg)=> {
  // clean existing results
  let winners = [];
  let i = 1;
  let nbTirage = lots.length < joueurs.length ? lots.length : joueurs.length;
  while (i <= nbTirage) {
    let winner = randomTicket(joueurs);
    winner.numLot = lots[i-1].numLot;
    winner.lot = lots[i-1].lot;
    winners.push(winner);
    joueurs = arrayRemoveNumticket(joueurs, winner);
    i++;
  }

  csv.writeToPath(path.resolve(__dirname, 'gagnants_par_alphabetique.csv'), winners.sort(compare), { headers: headersWinners})
  .on('error', err => console.error(err))
  .on('finish', () => win.webContents.send('gagnants_par_alphabetique', path.resolve(__dirname, 'gagnants_par_alphabetique.csv')));

  csv.writeToPath(path.resolve(__dirname, 'gagnants_par_lot.csv'), winners.sort(compareNumLot), { headers: headersWinners})
  .on('error', err => console.error(err))
  .on('finish', () => win.webContents.send('gagnants_par_lot', path.resolve(__dirname, 'gagnants_par_lot.csv')));
})

function callbackClickLot(lotFile) {
  if(lotFile==undefined){
    console.log("No file selected");
  } else {
    csv.parseFile(lotFile[0], { headers: ["numLot","lot"], renameHeaders: true })
    .on('error', error => console.error(error))
    .on('data', row => {
      console.log("lot row !", row);
      lots.push(row);
    })
    .on('end', () => {
      console.log("lots !", lots);
    })
  }
}

function callbackClickJoueurs(joueursFile) {
  if(joueursFile==undefined){
    console.log("No file selected");
  } else {
    csv.parseFile(joueursFile[0], { headers: headersPlayers, renameHeaders: true })
    .on('error', error => console.error(error))
    .on('data', row => {
        console.log("joueurs row !", row);
        joueurs.push(row);
    })
    .on('end', () => {
        console.log("joueurs !", joueurs);
    })
  }
}


function randomTicket(joueurs) {
  return joueurs[Math.floor(Math.random() * joueurs.length)];
}

function arrayRemoveNumticket(arr, value) {
  return arr.filter(function(ele){
      return ele.numticket != value.numticket;
  });
}

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const nomA = a.nom.toUpperCase();
  const nomB = b.nom.toUpperCase();

  let comparison = 0;
  if (nomA >= nomB) {
    comparison = 1;
  } else if (nomA <= nomB) {
    comparison = -1;
  }
  return comparison;
}   

function compareNumLot(a,b) {
  const lotA = a.numLot;
  const lotB = b.numLot;randomTicket

  return lotA-lotB;
}

// Cette méthode sera appelée quant Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
// Certaines APIs peuvent être utilisées uniquement quand cet événement est émit.
app.on('ready', createWindow)

// Quitte l'application quand toutes les fenêtres sont fermées.
app.on('window-all-closed', () => {
  // Sur macOS, il est commun pour une application et leur barre de menu
  // de rester active tant que l'utilisateur ne quitte pas explicitement avec Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // Sur macOS, il est commun de re-créer une fenêtre de l'application quand
  // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres d'ouvertes.
  if (win === null) {
    createWindow()
  }
})