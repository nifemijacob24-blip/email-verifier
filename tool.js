import axios from 'axios';
import bodyParser from 'body-parser'
import express from 'express'

const app = express()





app.use(express.static('public'));
function sanitizeInput(first, last,middle, domain) {
    
    // 1. Helper logic: cleans one string at a time
    const cleanString = (text) => {
        if (!text) return ""; // Safety check if input is empty
        return text
            .toLowerCase()              // Make it lowercase
            .trim()                     // Remove spaces from start and end
            .replace(/[^a-z0-9]/g, ""); // Regex: Remove anything that isn't a letter or number
                                        // (This strips apostrophes, dots, hyphens inside names)
    };

    // 2. Return the object with clean building blocks
    return {
        fn: cleanString(first),
        ln: cleanString(last),
        mn: cleanString(middle),
        dm: domain.toLowerCase().trim(), // Don't strip dots from domain!
        
        // 3. Bonus: Automatically generate initials here
        fi: cleanString(first).charAt(0),
        li: cleanString(last).charAt(0),
        mi: cleanString(middle).charAt(0)
    };
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

app.get('/', (req,res)=>{
    res.render('index.ejs')
})

app.post('/find', async(req, res) => {
    // 1. Get and Clean Data
    const rawData = req.body; 
    const cleanData = sanitizeInput(rawData.fName, rawData.lName, rawData.mName, rawData.domain);
    
    // 2. Extract variables LOCALLY (Don't use global variables!)
    // We add the "@" here to make the loop cleaner
    const fn = cleanData.fn;
    const ln = cleanData.ln;
    const mn = cleanData.mn;
    const mi = cleanData.mi;
    const fi = cleanData.fi;
    const li = cleanData.li;
    const dm = "@" + cleanData.dm; 
    
    // 3. Create a fresh list for THIS user request
    let email = [];
    let separators = ['.', '_','']
    email.push(fn+dm);
    email.push(ln+dm);
    email.push(mn+dm)

    // 4. NOW run the loop (Inside the route!)
    // FIX: Use separators.length, not just separators
    for (let i = 0; i < separators.length; i++) {
        const sep = separators[i]; // Grab the current separator

        email.push(fn + sep + ln + dm);
        email.push(fi + sep + ln + dm);
        email.push(fn + sep + li + dm);
        email.push(fi + sep + li + dm);
        email.push(ln + sep + fn + dm);
        email.push(ln + sep + fi + dm);
        email.push(li + sep + fn + dm);
        

        // Middle name check
        if (mn) {
             email.push(fn + sep + mi + sep + ln + dm);
             email.push(fi + sep + mi + sep + ln + dm);
             email.push(fn + sep + mn + sep + ln + dm);
             email.push(mn + sep + ln + dm);
             email.push(mn + sep + fn + dm);
             
             email.push(fn + sep + mn + dm);
             email.push(ln + sep + mn + dm);
        }

    }
    console.log(email)
    
    // Inside your app.post route, after generating results:
    const emailString = email.join('\n');
    try{
        const result = await axios.postForm('https://mail7.net/api/validate-bulk', {emails:emailString})
        const allEmails = result.data.results
        const trueEmails = allEmails.filter(product => product.valid === true)
        console.log(trueEmails)
        res.render('index.ejs', {validEmails: trueEmails})

    }catch(error){
        console.log(error.response)
        res.status(500)
    }
    
    

    // 5. Send the calculated emails to the page
    // (You must pass 'emails' here so EJS can see it)
});

const port = process.env.PORT || 3000;
app.listen(port, (req,res)=>{
    console.log('running on port 3000')
})
