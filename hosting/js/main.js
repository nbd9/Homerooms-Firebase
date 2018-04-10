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
                M.toast({ html: `Thank you! ${name} has been successfully registered for Homeroom.` })
            })

            setInterval(function () {
                location.reload()
            }, 3000)
        })
        .catch(function (error) {
            console.error(error)
            M.toast({ html: error.message })
        })
}

function checkForm() {
    return $('#email').val().split('@').slice(1) == 'loswego.k12.or.us' && $('#password').val() && $('#first_name').val() && $('#last_name').val() && $("#teacher-a").val() && $("#teacher-b").val()
}

$(document).ready(function () {
    $('select').formSelect();
});

firebase.database().ref('/teachers/').orderByChild('lastName').once('value').then(function (snapshot) {
    // Add option for early release
    $('select').append($("<option></option>").attr("value", 0).text("None / Early Release"))
    
    var teachers = snapshot.val()

    for (var key in teachers) {
        if (teachers.hasOwnProperty(key)) {
            var teacher = teachers[key]
            var value = teacher.lastName + ', ' teacher.firstName
            $('select').append($("<option></option>").attr("value", teacher.id).text(value))
        }
    }

    $('select').formSelect();
})