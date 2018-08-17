import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'
import * as moment from 'moment'
import * as Expo from 'expo-server-sdk'

interface teacher {
    email: string
    name: string
    id: string
    room: string | number
    specialty: string
    picture?: string
}

interface user {
    id: number
    name: string
    lastRequest?: string
    defaultTeachers?: { string } | [ string ],
    role: 'student' | 'qa' | 'teacher',
    room?: string | number
    specialty?: string
    token?: string
}

interface request {
    user: string // we only care about id
    newteacher: string // we only care about id
    oldTeacher: string // we only care about id
    accepted: boolean
    viewed: boolean
    timestamp: string
    requestedTime: string
    day?: string 
    reason?: string
}

admin.initializeApp()

const db = admin.database()
const expo = new Expo()

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


const generateRequestEmail = (teacher: teacher, student: user, requestedDate: string, reason: string, acceptLink: string, declineLink: string) => {
    // let date = DateTime.local().toLocaleString(DateTime.DATE_HUGE)
    let date = moment(requestedDate).format('dddd, MMMM Do')
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
                    .button {
                        margin: 0 5px;
                        background: none;
                        border-radius: 10%;
                        width: 100px;
                        height: 50px;
                        color: #1E88E5;
                        border: 5px solid #1E88E5;
                        text-align: center;
                        transition: all 1s ease;
                        opacity: 0.7;
                        text-decoration: none;
                        background-color: #EEEEEE;
                        color: #333333;
                        padding: 2px 6px 2px 6px;
                        border-top: 1px solid #CCCCCC;
                        border-right: 1px solid #333333;
                        border-bottom: 1px solid #333333;
                        border-left: 1px solid #CCCCCC;
                    }
                    .button:hover {
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
                    <h5>Dear ${teacher.name}, </h5>
                    <p><span class="name">${student.name}</span> would like to attend your homeroom on <span class="date">${date}</span> because <span class="reason">"${reason}"</span>. </p>
                    <p class = "center"> Do you accept this request? </p>
                    <div class = "wrapper">
                        <a class="button" id="accept-btn" href="${acceptLink}">Accept</a>
                        <a class="button" id="reject-btn" href="${declineLink}">Reject</a> 
                    </div>
                    <p> Sincerely, <br>
                    <br>
                    The Homerooms Team </p>
                    <footer>
                        <p>This message is from Homerooms, an app to connect teachers and learners.
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

const generateAcceptedScreen = (student: user, requestedDate: string) => {
    let date = moment(requestedDate).format('dddd, MMMM Do')
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
                        <p>This message is from Homerooms, an app to connect teachers and learners. <br>
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

const generateDeniedScreen = (student: user, requestedDate: string) => {
    let date = moment(requestedDate).format('dddd, MMMM Do')
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
                        <p>This message is from Homerooms, an app to connect teachers and learners.
                        </p>
                    </footer>
                </div>
            </body>
        </html>
    `)
}

const generateConfirmationScreen = (student: user, requestedDate: string) => {
    let date = moment(requestedDate).format('dddd, MMMM Do')
    return (
        `
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
        .center {
            text-align: center;
        }
        footer {
            margin-top: 50px;
            font-size: 0.8em;
            text-align: center;
            color: #888;
        }
        .symbol {
            font-size: 5em;
            color: #cc4656;
            display: block;
            text-align: center;
            line-height: 1em;
        }
        </style>
        </head>
        <body>
        <div id="content-wrap"> <span class="symbol">!</span>
        <p class="center"><span class="name">${student.name}</span> has been accepted into a different homeroom for <span class="date">${date}</span>, and as such will be going straight there and should not be marked absent. <br>
            Happy teaching!</p>
        <p>This message is from Homerooms, an app to connect teachers and learners. <br>
        </p>
        </div>
        </body>
        </html>
    `
    )
}

const generateErrorScreen = (error) => {
    console.error(error)
    return (
        `
        <!doctype html>
        <html>
        <head>
        <meta charset="utf-8">
        <title>Error</title>
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
            h3 {
                font-size: 2em;
                font-weight: bold;
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
            .symbol {
                font-size: 5em;
                color: #cc4656;
                display: block;
                text-align: center;
                line-height: 1em;
            }
            </style>
        </head>

        <body>
        <div id="content-wrap"> <span class="symbol">Error</span>
        <h3 class="center">An error occured while trying to process a student. Please try again and ensure all infornation in the request is correct. If the eror persists, please let us know</h3>
        <p class="center">Error information: <span class="error">${error}</span></p>
        <footer>
            <p>This message is from Homerooms, an app to connect teachers and learners.
            </p>
        </footer>
        </div>
        </body>
        </html>
        `
    )
}

/**
 * Sends an email to the requested teacher, asking to accept the student into Support Seminar
 */
exports.sendRequest = functions.database.ref('/schools/{school}/requests/{requestID}')
    .onCreate((snapshot, context) => {
        let request: request = snapshot.val()
        let teacherRef = db.ref(`schools/${context.params.school}/teachers/${request.teacher}`)
        let studentRef = db.ref(`users/${request.user}`)

        let acceptLink = `https://homerooms-nbdeg.firebaseapp.com/acceptRequest/${context.params.school}/${context.params.requestID}`
        let declineLink = `https://homerooms-nbdeg.firebaseapp.com/declineRequest/${context.params.school}/${context.params.requestID}` 

        teacherRef.once('value', function (teacherSnapshot) {
            let teacher: teacher = teacherSnapshot.val()
            studentRef.once('value', function (studentSnapshot) {
                let student: user = studentSnapshot.val()
                if (student.role == 'student') {
                    let mailOptions = {
                        from: '"Homerooms" <' + functions.config().gmail.email + '>',
                        to: teacher.email,
                        subject: 'Homeroom Student Request',
                        text: `${student.name} has requested to come to your homeroom. To accept, please click this link: ${acceptLink}. To decline, please click this link: ${declineLink}`,
                        html: generateRequestEmail(teacher, student, request.requestedTime, request.reason, acceptLink, declineLink)
                    }
                    mailTransport.sendMail(mailOptions)
                } else {
                    console.log('Non-student account - no need to send an email.')
                }
            })
        })
    }
)

/**
 * Accepts the student request and sends them a push notifcation
 */
exports.acceptRequest = functions.https.onRequest((req, res) => {
    const params = req.url.split('/')
    const schoolID = params[2]
    const requestID = params[3]
    const ref = db.ref(`schools/${schoolID}/requests/${requestID}`)

    // Set accepted value
    ref.update({
        accepted: true
    }, function (error) {
        if (error) {
            return res.send(generateErrorScreen(error))
        } else {
            console.log('User accepted.')
            return null
        }
    })

    return ref.once('value', function (requestSnapshot) {
        let request: request = requestSnapshot.val()
        
        db.ref('users/' + request.user).once('value', function (userSnapshot) {
            let student: user = userSnapshot.val()

            // Getting correct teacher ref
            let teacherKey = (request.day === 'A') ? student.defaultTeachers['A'] : student.defaultTeachers['B']
            db.ref(`teachers/${teacherKey}`).once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()
                let mailOptions = {
                    from: '"Homerooms" <' + functions.config().gmail.email + '>',
                    to: teacher.email,
                    subject: 'Homeroom Student Transfer',
                    text: 'Hello ' + teacher.name + ',\n' + student.name + ' has been accepted into a different Homeroom, and as such will be going straight there. Please do not mark them absent.',
                    html: generateConfirmationScreen(student, request.requestedTime)
                }

                mailTransport.sendMail(mailOptions)

                // Sending push notification
                let notifcation = [{
                    to: student.token,
                    sound: 'default',
                    title: 'Homeroom Request',
                    body: `Your Homeroom request for ${teacher.name} on ${moment(request.requestedTime).format('dddd, MMMM Do')} has been accepted!`,
                }]

                expo.sendPushNotificationsAsync(notifcation)
            })

            // Displaying the accept HTML screen
            return res.send(generateAcceptedScreen(student, request.requestedTime))
        })
    })
})

/**
 * Denys the student request and sends them a push notifcation
 */
exports.denyRequest = functions.https.onRequest((req, res) => {
    const params = req.url.split('/')
    const schoolID = params[2]
    const requestID = params[3]
    const ref = db.ref(`schools/${schoolID}/requests/${requestID}`)

    // Set accepted value
    ref.update({
        accepted: true
    }, function (error) {
        if (error) {
            return res.send(generateErrorScreen(error))
        } else {
            console.log('User denied.')
            return null
        }
    })

    return ref.once('value', function (requestSnapshot) {
        let request: request = requestSnapshot.val()

        db.ref('users/' + request.user).once('value', function (userSnapshot) {
            let student: user = userSnapshot.val()

            // Getting correct teacher ref
            let teacherKey = (request.day === 'A') ? student.defaultTeachers['A'] : student.defaultTeachers['B']
            db.ref(`teachers/${teacherKey}`).once('value', function (teacherSnapshot) {
                let teacher: teacher = teacherSnapshot.val()
                
                // Sending push notification
                let notifcation = [{
                    to: student.token,
                    sound: 'default',
                    title: 'Homeroom Request',
                    body: `Your Homeroom request for ${teacher.name} on ${moment(request.requestedTime).format('dddd, MMMM Do')} has been denied.`,
                }]

                expo.sendPushNotificationsAsync(notifcation)
            })

            // Displaying the accept HTML screen
            return res.send(generateDeniedScreen(student, request.requestedTime))
        })
    })
})