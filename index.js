require('dotenv').config();
const express= require('express')
const {google}=require('googleapis');
const app=express();
const bodyParser=require('body-parser')
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

async function getAuthSheets(){
  const auth=new google.auth.GoogleAuth({
    keyFile:"secret.json",
    scopes:"https://www.googleapis.com/auth/spreadsheets"
  })
  const client=await auth.getClient();
  const googleSheets=google.sheets({
    version:"v4",
    auth:client
  })
  const spreadsheetId=`${process.env.SPREADSHEET_ID}`;
  return{
    auth,client,googleSheets,spreadsheetId
  }
}

app.get('/',(req,res)=>{
  res.send("<h1>Another Google Sheet API V1</h1>");
})

app.get('/metadata',async (req,res)=>{
  const {googleSheets,auth,spreadsheetId}=await getAuthSheets();
  const metadata=await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId
  })
  console.log(metadata)
  res.send(metadata.data);
})
//  BACA DATA
app.get("/read-data", async (req, res) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Sheet1",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const datasheets=getRows.data.values
  const perapihanawal= datasheets.map((a)=>{
    return{
        "NIK":`${a[0]}`,
        "NAMA":`${a[1]}`,
    "STATUS":`${a[2]}`,
 }
})
const jumlahData=datasheets.length;
const noHeaders=perapihanawal.splice(1,jumlahData)
  console.log(datasheets)
    return res.send(noHeaders)
   
  

});
////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// INSERT DATA
app.get('/insert&NAMA=:nama&STATUS=:status',async(req,res)=>{
    const NAMA=req.params.nama;
    const STATUS=req.params.status;
    console.log({
        "nama":JSON.stringify(NAMA),
        "status":STATUS
    })
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    
    
    try{
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "Sheet1",
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING",
          });
         

          const datayangdigunakan= getRows.data.values;
          var jumlahdata=datayangdigunakan.length;
          const filterdata=datayangdigunakan.filter(a=>a[1]==NAMA)
          if(filterdata.length>0){
            return res.send("data ini tidak bisa di input karena  sudah pernah dimasukan sebelumnya")
          };
       await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range:'Sheet1!A:C',
            valueInputOption:"USER_ENTERED",
            resource:{
                values:[[jumlahdata,NAMA,STATUS]]
            }
        })
        //console.log(InsertData)
        return res.send("Data Berhasil di input");
    }catch(err){
        console.log(err)
        return res.send(err);
    }
    
})

////////////////
// UPDATE DATA
app.get('/update&NAMASEBELUMNYA=:before&NAMA=:nama&STATUS=:status',async (req,res)=>{
    const SEBELUMNYA=req.params.before
    const NAMA=req.params.nama;
    const STATUS=req.params.status;
    console.log({
        "namasebelumnya":SEBELUMNYA,
        "nama":NAMA,
        "status":STATUS
    })
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    try{
        const getData = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "Sheet1",
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING",
          });
          const DATAdiperoleh=getData.data.values;
          const jumlahData=DATAdiperoleh.length;
        const perapihanawal= DATAdiperoleh.map((a)=>{
            return{
                "NIK":`${a[0]}`,
                "NAMA":`${a[1]}`,
            "STATUS":`${a[2]}`,
         }
        })
        const noHeaders=perapihanawal.splice(1,jumlahData)
        const Arr=[]
        noHeaders.map(a=>{
            Arr.push(a.NAMA)
        })
        console.log(Arr)
        const urutan=Arr.indexOf(SEBELUMNYA)
        const row=urutan+2
        const UpdateData=await googleSheets.spreadsheets.values.update({
            auth,
            spreadsheetId,
            range:`Sheet1!A${row}:C${row}`,
            valueInputOption:'USER_ENTERED',
            resource:{
                values:[[urutan+1,NAMA,STATUS]]
            }
        })
        console.log(UpdateData);
          return res.send(UpdateData)
    }catch(err){
        console.log(err)
        return res.send(err);
    }
})

////////////////////////
// DELETE DATA
app.get('/hapus&NAMA=:nama',async (req,res)=>{
    const NAMA=req.params.nama;
    
    console.log({
        "nama":NAMA
    })
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    try{
        const getData = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "Sheet1",
            valueRenderOption: "UNFORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING",
          });
          const DATAdiperoleh=getData.data.values;
          const jumlahData=DATAdiperoleh.length;
        const perapihanawal= DATAdiperoleh.map((a)=>{
            return{
                "NIK":`${a[0]}`,
                "NAMA":`${a[1]}`,
            "STATUS":`${a[2]}`,
         }
        })
        const noHeaders=perapihanawal.splice(1,jumlahData)
        const Arr=[]
        noHeaders.map(a=>{
            Arr.push(a.NAMA)
        })
        console.log(Arr)
        const urutan=Arr.indexOf(NAMA)
        if(urutan<0){
            return res.send("data yang anda maksud tidak ada di database")
        }
        const rowsStart=urutan+1
        const RowsEnd=urutan+2
        const HapusData=await googleSheets.spreadsheets.batchUpdate({
            auth,
            spreadsheetId,
            resource:{
                requests:[{
                    'deleteDimension': {
                        'range': {
                        'sheetId': 0,
                        'dimension': 'ROWS',
                        'startIndex': rowsStart,
                        'endIndex': RowsEnd
                        }
                    }
                }
                   ]
            }
        })
        
        console.log(HapusData);
          return res.send(HapusData.data)
    }catch(err){
        console.log(err)
        return res.send(err);
    }
})

////
app.listen(3000,(req,res)=>{
  console.log("server online")
})