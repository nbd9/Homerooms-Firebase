function signUp() {
    firebase.auth().createUserWithEmailAndPassword(email = $('#email').val(), password = $('#password').val())
        .then(function (user) {
            var uid = user.uid
            var name = $('#first_name').val() + ' ' + $('#last_name').val()
            firebase.database().ref('/users/' + uid).set({
                lastRequest: 0,
                name: name,
                seminars: {
                    a: $("#teacher-a").val(),
                    b: $("#teacher-b").val()
                }
            })

            firebase.auth().signOut().then(function () {
                $('.modal').modal('open')
            })
        })
        .catch(function (error) {
            console.error(error)
            M.toast({ html: error.message })
        })
}

function checkForm() {
    if ($('#email').val().split('@').slice(1) == 'loswego.k12.or.us' && $('#password').val() && $('#first_name').val() && $('#last_name').val() && $("#teacher-a").val() && $("#teacher-b").val()) {
        if ($('#access_key').val() == 'insertcoin') {
            signUp()
        } else {
            M.toast({ html: `Incorrect access key.` })
        }
    } else {
        M.toast({ html: 'Please fill out all parts.' })
    }
}

$(document).ready(function () {
    $('select').formSelect()
    $('.modal').modal()
});

firebase.database().ref('/teachers/').orderByChild('lastName').once('value').then(function (snapshot) {
    // Add option for early release
    $('select').append($("<option></option>").attr("value", 0).text("None / Early Release"))
    
    var teachers = snapshot.val()

    for (var key in teachers) {
        if (teachers.hasOwnProperty(key)) {
            var teacher = teachers[key]
            var value = teacher.lastName + ', ' + teacher.firstName
            $('select').append($("<option></option>").attr("value", teacher.id).text(value))
        }
    }

    $('select').formSelect();
})