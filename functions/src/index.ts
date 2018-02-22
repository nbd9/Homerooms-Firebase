import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'
import * as moment from 'moment'

interface teacher {
    email: string
    firstName: string
    id: string
    lastName: string
    room: string | number
    taughtCourses: string
    picture ?: string
}

interface student {
    id: number
    name: string
    lastRequest: string
    seminars: {
        a: string // corresponds to id
        b: string // corresponds to id
    }
}

interface request {
    user: string // We only really care about the UID
    pushID?: string
    teacher: string // First comes in as key
    accepted: boolean
    denied: boolean
    timestamp: string
    requestedTime: string
    reason: string
}

const serviceAccount = require('../homeroom-firebase-adminsdk-key.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lohs-supportseminar.firebaseio.com'
})

const db = admin.database()

const gmailEmail = functions.config().gmail.email
const gmailPassword = functions.config().gmail.password

// TODO: Buy domain and get actual email (through aws?)
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
})


const generateRequestEmail = (teacher: teacher, student: student, reason: string, acceptLink: string, declineLink: string) => {
    // let date = DateTime.local().toLocaleString(DateTime.DATE_HUGE)
    let date = moment().format('dddd, MMMM Do')
    return (`
        <!doctype html>
        <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css?family=Josefin+Slab|Nunito');
                    body {
                        background: #3b5998;
                        font-family: 'Nunito', sans-serif;
                        color: #000;
                    }
                    #content-wrap {
                        background: #f7f7f7;
                        width: 80%;
                        max-width: 1000px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    span {
                        color: #1E88E5;
                        font-weight: bold;
                        font-size: 1.2em;
                    }
                    h5 {
                        font-family: 'Josefin Slab', serif;
                        font-weight: bold;
                        color: #1E88E5;
                        font-size: 2em;
                        text-align: left;
                        margin: 0;
                    }
                    button {
                        margin: 0 5px;
                        background: none;
                        border-radius: 10%;
                        width: 100px;
                        height: 50px;
                        color: #1E88E5;
                        border: 5px solid #1E88E5;
                        transition: all 1s ease;
                        opacity: 0.7;
                    }
                    button:hover {
                        transform: scale(1.1);
                        opacity: 1;
                    }
                    #accept-btn {
                        border-color: #46cc56;
                        color: #46cc56;
                    }
                    #reject-btn {
                        border-color: #cc4656;
                        color: #cc4656;
                    }
                    .wrapper {
                        margin: 0 auto;
                        display: flex;
                        justify-content: center;
                    }
                    .center {
                        text-align: center;
                    }
                    footer {
                        margin-top: 50px;
                        font-size: 0.8em;
                        text-align: center;
                        color: #888;
                    }
                    .preheader {
                        color: transparent;
                        display: none !important;
                        height: 0;
                        max-height: 0;
                        max-width: 0;
                        opacity: 0;
                        overflow: hidden;
                        mso-hide: all;
                        visibility: hidden;
                        width: 0;
                    }
                </style>
            </head>
            <body>
                <p class="preheader">${student.name} wants to attend your homeroom.</p>
                <div id="content-wrap">
                    <h5>Dear ${teacher.firstName} ${teacher.lastName}, </h5>
                    <p><span class="name">${student.name}</span> would like to attend your homeroom on <span class="date">${date}</span> because <span class="reason">"${reason}"</span>. </p>
                    <p class = "center"> Do you accept this request? </p>
                    <div class = "wrapper">
                    <button id="accept-btn" onclick="location.href='${acceptLink}';"> Accept </button>
                    <button id="reject-btn" onclick="location.href='${declineLink}';"> Reject </button>
                    </div>
                    <p> Sincerely, <br>
                    <br>
                    The Homeroom Team </p>
                    <footer>
                        <p>This message is from Homeroom, an app to connect teachers and learners. <br>
                            Contact us at <a href='mailto:contact@homeroom-app.com'>contact@homeroom-app.com <br>
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

const generateAcceptedScreen = (student: student) => {
    let date = moment().format('dddd, MMMM Do')
    return (`
        <!doctype html>
        <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css?family=Josefin+Slab|Nunito');
                    body {
                        background: #3b5998;
                        font-family: 'Nunito', sans-serif;
                        color: #000;
                    }
                    #content-wrap {
                        background: #f7f7f7;
                        width: 80%;
                        max-width: 1000px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    span {
                        color: #1E88E5;
                        font-weight: bold;
                        font-size: 1.2em;
                    }
                    .wrapper {
                        margin: 0 auto;
                        display: flex;
                        justify-content: center;
                    }
                    .center {
                        text-align: center;
                    }
                    footer {
                        margin-top: 50px;
                        font-size: 0.8em;
                        text-align: center;
                        color: #888;
                    }
                    .check {
                        font-size: 5em;
                        color: #46cc56;
                        display: block;
                        text-align: center;
                        line-height: 1em;
                    }
                </style>
            </head>
            <body>
                <div id="content-wrap"> <span class="check">✔</span>
                    <p class="center"><span class="name">${student.name}</span> has been accepted into your Homeroom on <span class="date">${date}</span>. <br>
                    Happy teaching!</p>
                    <footer>
                        <p>This message is from Homeroom, an app to connect teachers and learners. <br>
                            Contact us at <a href='mailto:contact@homeroom-app.com'>contact@homeroom-app.com <br>
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

const generateDeniedScreen = (student: student) => {
    let date = moment().format('dddd, MMMM Do')
    return (`
        <!doctype html>
        <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css?family=Josefin+Slab|Nunito');
                    body {
                        background: #3b5998;
                        font-family: 'Nunito', sans-serif;
                        color: #000;
                    }
                    #content-wrap {
                        background: #f7f7f7;
                        width: 80%;
                        max-width: 1000px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    span {
                        color: #1E88E5;
                        font-weight: bold;
                        font-size: 1.2em;
                    }
                    .wrapper {
                        margin: 0 auto;
                        display: flex;
                        justify-content: center;
                    }
                    .center {
                        text-align: center;
                    }
                    footer {
                        margin-top: 50px;
                        font-size: 0.8em;
                        text-align: center;
                        color: #888;
                    }
                    .check {
                        font-size: 5em;
                        color: #46cc56;
                        display: block;
                        text-align: center;
                        line-height: 1em;
                    }
                </style>
            </head>
            <body>
                <div id="content-wrap"> <span class="check">✔</span>
                    <p class="center"><span class="name">${student.name}'s</span> request for your Homeroom on <span class="date">${date}</span> has been denied. <br>
                    Happy teaching!</p>
                    <footer>
                        <p>This message is from Homeroom, an app to connect teachers and learners. <br>
                            Contact us at <a href='mailto:contact@homeroom-app.com'>contact@homeroom-app.com <br>
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

/**
 * Sends an email to the requested teacher, asking to accept the student into Support Seminar
 */
exports.sendRequest = functions.database.ref('/requests/{pushId}')
    .onWrite(event => {
        let request: request = event.data.val()

        // Make sure there's a need to continue.
        if (request.accepted === false) {
            let teacherKey = request.teacher
            let studentKey = request.user

            console.log('Sending request email', event.params.pushId, teacherKey)
            let acceptLink = 'https://lohs-supportseminar.firebaseapp.com/acceptRequest/' + event.params.pushId
            let declineLink = 'https://lohs-supportseminar.firebaseapp.com/declineRequest/' + event.params.pushId

            let teacherRef = db.ref('teachers/' + teacherKey)
            let studentRef = db.ref('users/' + studentKey)

            teacherRef.once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()
                studentRef.once('value', function (studentSnapshot) {
                    let student: student = studentSnapshot.val()
                    let mailOptions = {
                        from: '"Homeroom" <' + functions.config().gmail.email + '>',
                        to: teacher.email,
                        subject: 'Homeroom Student Request',
                        text: `${student.name} has requested to come to your homeroom. To accept, please click this link: ${acceptLink}. To decline, please click this link: ${declineLink}`,
                        html: generateRequestEmail(teacher, student, request.reason, acceptLink, declineLink)
                    }

                    return mailTransport.sendMail(mailOptions)
                })
            })
        }
    })

/**
 * Accepts the student request and sends them a push notifcation
 */
exports.acceptRequest = functions.https.onRequest((req, res) => {
    const params = req.url.split('/')
    const requestID = params[2]
    const ref = db.ref('requests/' + requestID)

    // Set accepted value
    ref.update({
        accepted: true
    }, function (error) {
        if (error) {
            console.log('Error setting accepted value.' + error)
            return res.send(`
            <!doctype html>
            <html>
                <head>
                    <title>Homeroom Request</title>
                </head>
                <body>
                    <h1>There was an error accepting the user. Please try again later.\n${error}</h1>
                </body>
            </html>`
            )
        } else {
            console.log('User accepted.')
            return null
        }
    })

    // Send e-mail to current homeroom teacher
    ref.once('value', function (requestSnapshot) {
        db.ref('users/' + requestSnapshot.val().user).once('value', function (userSnapshot) {
            let student: student = userSnapshot.val()
            db.ref('teachers/' + userSnapshot.val().defaultSeminar).once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()
                let mailOptions = {
                    from: '"Homeroom" <' + functions.config().gmail.email + '>',
                    to: teacher.email,
                    subject: 'Homeroom Student Transfer',
                    text: 'Hello ' + teacher.firstName + ' ' + teacher.lastName + ',\n' + student.name + ' has been accepted into a different Homeroom, and as such will be going straight there. Please do not mark them absent.',
                    html: '<h1>Hello ' + teacher.firstName + ' ' + teacher.lastName + ',</h1>\n<p>' + student.name + ' has been accepted into a different Homeroom, and as such will be going straight there. Please do not mark them absent.</p>'
                }

                mailTransport.sendMail(mailOptions)
            })
        })
    })

    // Return HTML file.
    return ref.once('value', (requestSnapshot) => {
        let request: request = requestSnapshot.val()

        db.ref('users/' + requestSnapshot.val().user).once('value', function (studentSnapshot) {
            let student: student = studentSnapshot.val()

            db.ref('teachers/' + requestSnapshot.val().teacher).once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()

                if ('pushID' in request) {
                    let payload = {
                        notification: {
                            title: 'Homeroom Request',
                            body: `Your Homeroom request for ${teacher.lastName} on ${moment(request.requestedTime).format('dddd, MMMM Do')} has been approved!`
                        }
                    }
                    admin.messaging().sendToDevice(request.pushID, payload)
                }

                return res.send(generateAcceptedScreen(student))
            })
        })
    })
})

/**
 * Denys the student request and sends them a push notifcation
 */
exports.denyRequest = functions.https.onRequest((req, res) => {
    const params = req.url.split('/')
    const requestID = params[2]
    const ref = db.ref('requests/' + requestID)

    // Set accepted value
    ref.update({
        denied: true
    }, function (error) {
        if (error) {
            console.log('Error setting accepted value.' + error)
            return res.send(`
            <!doctype html>
            <html>
                <head>
                    <title>Homeroom Request</title>
                </head>
                <body>
                    <h1>There was an error denying the user. Please try again later.\n${error}</h1>
                </body>
            </html>`
            )
        } else {
            console.log('User denied.')
            return null
        }
    })

    // Return HTML file.
    return ref.once('value', (requestSnapshot) => {
        let request: request = requestSnapshot.val()

        db.ref('users/' + requestSnapshot.val().user).once('value', function (studentSnapshot) {
            let student: student = studentSnapshot.val()

            db.ref('teachers/' + requestSnapshot.val().teacher).once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()

                if ('pushID' in request) {
                    let payload = {
                        notification: {
                            title: 'Homeroom Request',
                            body: `Your Homeroom request for ${teacher.lastName} on ${moment(request.requestedTime).format('dddd, MMMM Do')} has been denied.`
                        }
                    }
                    admin.messaging().sendToDevice(request.pushID, payload)
                }

                return res.send(generateDeniedScreen(student))
            })
        })
    })
})