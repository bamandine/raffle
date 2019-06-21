const { app, BrowserWindow, dialog, ipcMain} = require('electron')
const csv = require('fast-csv') 
const path = require('path')

const headersPlayers = ["numticket","nom","prenom","numtel"]
const headersWinners = headersPlayers.concat("lot")

let nbWinners = 0;
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

  // Ouvre les DevTools.
  win.webContents.openDevTools()

    let nbWInners;
      // $('#text-input').bind('input propertychange', function() {
    //     nbWInners = this.value
    //     console.log(nbWInners);
    // })


  // Émit lorsque la fenêtre est fermée.
  win.on('closed', () => {
    // Dé-référence l'objet window , normalement, vous stockeriez les fenêtres
    // dans un tableau si votre application supporte le multi-fenêtre. C'est le moment
    // où vous devez supprimer l'élément correspondant.
    win = null
  })
}

ipcMain.on('set-nb-winners', (event,arg) => {
  nbWinners = arg;
})

ipcMain.on('click-button',(event,arg)=> {
  if(arg=='true'){
    dialog.showOpenDialog(
      { 
        properties: ['openFile'], 
        filters: [
          { name: 'Excel ou CSV', extensions: ['csv', 'xls'] }
        ]
      }, (files) =>{
        callbackClick(files);
      })   
  }
})

function callbackClick(files) {
  let tickets = [];
  let winners = [];

  csv.parseFile(files[0], { headers: headersPlayers, renameHeaders: true })
    .on('error', error => console.error(error))
    .on('data', row => {
        tickets.push(row);
    })
    .on('end', randomAndWriteFile => {
      let i = 1;
      while (i <= nbWinners) {
        let winner = randomTicket(tickets);
        winner.lot = i;
        winners.push(winner);
        tickets = arrayRemoveNumticket(tickets, winner);
        i++;
      }

      csv.writeToPath(path.resolve(__dirname, 'gagnants_par_alphabetique.csv'), winners.sort(compare), { headers: headersWinners})
      .on('error', err => console.error(err))
      .on('finish', () => win.webContents.send('gagnants_par_alphabetique', path.resolve(__dirname, 'gagnants_par_alphabetique.csv')));

      csv.writeToPath(path.resolve(__dirname, 'gagnants_par_lot.csv'), winners.sort(compareLot), { headers: headersWinners})
      .on('error', err => console.error(err))
      .on('finish', () => win.webContents.send('gagnants_par_lot', path.resolve(__dirname, 'gagnants_par_lot.csv')));
    });
}

function randomTicket(tickets) {
  return tickets[Math.floor(Math.random() * tickets.length)];
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

function compareLot(a,b) {
  const lotA = a.lot;
  const lotB = b.lot;

  let comparison = 0;
  if (lotA >= lotB) {
    comparison = 1;
  } else if (lotA <= lotB) {
    comparison = -1;
  }
  return comparison;
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