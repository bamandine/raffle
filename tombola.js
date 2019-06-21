$(() => {

  const { dialog } = require('electron')

    let nbWInners;
    $('#text-input').bind('input propertychange', function() {
        nbWInners = this.value
        console.log(nbWInners);
    })

    $('#openFile').bind('click', function() {
      let pathTombolaFile = dialog.showOpenDialog(
        { 
          properties: ['openFile'], 
          filters: [
            { name: 'Excel ou CSV', extensions: ['csv', 'xls'] }
          ]
        }
      )
  
      let tickets = [];
      let winners = [];
      let firstLine=true;
      csv
        .parseFile(pathTombolaFile[0], {headers:true})
        .on('error', error => console.error(error))
        .on('data', row => {
            tickets.push(row);
            
        })
        .on('end', randomAndWriteFile => {
          let i = 0;
          while (i < numWinners) {
            let winner = randomTicket(tickets);
            winners.push(winner);
            tickets = arrayRemoveNumticket(tickets, winner);
            i++;
          }
  
          csv.writeToPath(path.resolve(__dirname, 'tmp.csv'), winners.sort(compare), {headers: ["numticket","nom","prenom","numtel"]})
          .on('error', err => console.error(err))
          .on('finish', () => console.log('Done writing.'));
        });
  
    })

      
    function randomTicket(tickets) {
      return tickets[Math.floor(Math.random() * tickets.length)];
    }

    function arrayRemoveNumticket(arr, value) {
      return arr.filter(function(ele){
          return ele.num_ticket != value.num_ticket;
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
    
 
})