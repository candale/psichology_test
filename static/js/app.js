var PsihoApp = angular.module('PsihoApp', ['ngAudio', 'uiSlider'])

PsihoApp.config(function($interpolateProvider){
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});

MESSAGES = {
    INTRO: {
        message: "În cadrul acestui experiment veți avea de realizat două sarcini care vor evalua două " +
                "componente ale inteligenței dumneavoastră: capacitatea de a realiza raționamente perceptuale și " +
                "verbale. Scopul cercetării este de a compara nivelul de inteligență între participanți, în funcție de " +
                "anumite trăsături de personalitate pe care aceștia le dețin. Majoritatea oamenilor rezolvă aceste sarcini " +
                "fără dificultăți majore. Durata acestora va depinde și de performanța dumneavoastră. Dacă nu sunt " +
                "întrebări, apăsați butonul de începere.",
        buttonText: "Incepe"
    },
    IMAGES: {
        message: "În această sarcină vi se vor prezenta câteva serii de imagini. Fiecare imagine prezintă două " +
                "chenare, unul în stânga, altul în dreapta. Chenarele conțin anumite caracteristici perceptuale. Aceste " +
                "caracteristici reprezintă patru dimensiuni diferite (culoare, formă, literă, mărimea literei), fiecare " +
                "dimensiune putând lua două valori distincte (verde/roșu, pătrat/cerc, A/T, literă mică/mare), așa cum " +
                "puteți observa în exemplul de pe foaia din fața dumneavoastră." +
                "Veți urmări patru serii de imagini. Pentru fiecare serie, " +
                "am desemnat ca fiind corectă una din aceste opt valori menționate. La fiecare imagine, sarcina " +
                "dumneavoastră va fi să alegeți care dintre cele două chenare conține această valoare. Pentru a face asta, " +
                "aveți la dispoziție 15 secunde să dați click pe unul dintre butoanele aflate sub imagine (cel din stânga sau " +
                "cel din dreapta). Dacă alegerea dumneavoastră este incorectă, un semnal zgomotos vă va semnala acest " +
                "lucru, iar dacă alegerea este corectă, nu veți fi semnalați. Folosiți semnalul primit pentru a determina " +
                "care este valoarea desemnată (verde/roșu, pătrat/cerc, A/T, literă mică/mare). Dacă aveți întrebări, " +
                "adresați-le acum asistentului.",
        buttonText: "Incepe"
    },
    ANAGRAMS: {
        message: "În această sarcină, va trebui să rezolvați un număr de anagrame. Anagramele sunt șiruri de " +
                "litere care trebuie reordonate pentru a forma un cuvânt. De exemplu, LGO este o anagramă pentru " +
                "cuvântul GOL. Sarcina dumneavoastră este așadar aceea de a rearanja literele într-un cuvânt existent în " +
                "limba română și de a trece răspunsul în chenarul aferent. Anagramele vor urma 3 niveluri de dificultate " +
                "(scăzut – două cuvinte; mediu – două cuvinte; crescut – un cuvânt). Nu aveți o limită de timp, așa că " +
                "încercați să rezolvați anagramele cât mai bine, iar în cazul în care doriți să treceți peste una dintre ele, " +
                "aveți opțiunea de a sări peste. Rezolvarea acestei sarcini depinde de abilități similare sarcinii de la " +
                "începutul acestui studiu." +
                "Atenție: cuvintele nu conțin diacritice (ă, â, î, ș, ț - adică nu vor exista cuvinte precum fâș, șarpe, braț etc) " +
                "și sunt fie substantive, fie adjective (deci nu conțin acțiuni). Dacă există vreo întrebare sau vreo " +
                "roblemă, anunțați asistentul.",
        buttonText: "Incepe"
    },
    PAUZA_ASISTENT: {
        message: "Vă rugăm anunțați asistentul înainte să continuați.",
        buttonText: "Continuați"
    }
}


PsihoApp.factory('psihoService', ['$http', function($http) {
    var service = {};

    service.getAnagrams = function() {
        return $http({
            method: 'GET',
            url: '/anagrams.json',
        });
    };

    service.getQuizes = function() {
        return $http({
            method: 'GET',
            url: '/quiz.json'
        });
    };

    service.getImages = function() {
        return $http({
            method: 'GET',
            url: '/images.json'
        });
    };

    service.sendData = function(data) {
        return $http({
            method: 'POST',
            url: '/data.json',
            data: data
        });
    };

    return service;
}]);


PsihoApp.controller('AnagramController', ['$scope', 'psihoService', '$window', '$timeout', 'ngAudio',
 function($scope, psihoService, $window, $timeout, ngAudio) {
    var anagrams = null;
    var first_quizes = null;
    var second_quizes = [];
    var first_quiz = true;
    var second_quiz = false;
    var images = null;
    var currentQuizIndex = 0;
    var currentAnagramIndex = 0;
    var currentImageIndex = 0;
    var lastImageIndex = 0;
    var intervalId;
    var imageCount = 0;
    var imagesTimeout = null;
    var fromImages = false;
    var lastAnagramTime = 0;
    var randomness = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var timerStarted = false;
    var globalNextPage = "";
    var globalNextPageCallback = null;

    var firstStress = null;
    var secondStress = null;
    $scope.selectedQuestion = '';
    $scope.timer_running = true;
    $scope.time = 0;
    $scope.series = 1;
    $scope.bgColor = "#0F9D58";
    $scope.imagesErrorMsg = 'Prea târziu';
    $scope.showErrorText = false;
    $scope.imagesError = false;
    $scope.registeredStress = 0;

    function resetSliders() {
        $scope.feeling = {};
        $scope.feeling.descurajat = 1;
        $scope.feeling.furios = 1;
        $scope.feeling.ingrijorat = 1;
        $scope.feeling.vinovat = 1;
        $scope.feeling.trist = 1;
    }

    function sendData() {
        data = {
            "name": $scope.participantName,
            "first_quiz": first_quizes,
            "second_quiz": second_quizes,
            "first_stress": firstStress,
            "second_stress": secondStress,
            "anagrams": anagrams,
            "last_anagram_time": lastAnagramTime
        };
        psihoService.sendData(data);
    }

    // ================= timer functions =================
    function timerDone() {
        alert('time up. do smth');
    }

    function stopTimer() {
        timerStarted = false;
        $window.clearInterval(intervalId);
        $scope.time = 0;
    }

    function startTimer() {
        timerStarted = true;
        intervalId = $window.setInterval(function() {
            if($scope.time == 600000) {
                lastAnagramTime = $scope.time;
                $scope.imagesErrorMsg = 'Prea târziu';
                $scope.showErrorText = true;
                anagrams[currentAnagramIndex].user_answer = ">> timeout <<";
                showPage("imagesError");

                buzz();
                $timeout(function() {
                    showPage("second_quiz");
                    $scope.showErrorText = false;
                }, 1000);
            }
            $scope.time = $scope.time + 1;
            $scope.$apply();
        }, 1000);
    }

    function clearTimer() {
        $scope.time = 0;
    }

    // =================== page preparation function =====================
    function prepareFirstCurrentQuiz() {
        currentQuizIndex = 0;
        $scope.currentQuiz = first_quizes[currentQuizIndex];
        for(question in $scope.currentQuiz.questions) {
            question = $scope.currentQuiz.questions[question];
            question['option'] = '';
        }
    }

    function prepareSecondCurrentQuiz() {
        currentQuizIndex = 0;
        $scope.currentQuiz = second_quizes[currentQuizIndex];
        for(question in $scope.currentQuiz.questions) {
            question = $scope.currentQuiz.questions[question];
            question['option'] = '';
        }
    }

    function getNextImageIndex() {
        while(currentImageIndex == lastImageIndex) {
            currentImageIndex = Math.floor(Math.random() * 10000 % images.length);
        }
        lastImageIndex = currentImageIndex;
    }

    function generateRandomness() {
        for(i = 0; i < 10; i++) {
            randomness[i] = 0;
        }
        var randomSoFar = 0;
        while(randomSoFar != 5) {
            var no = Math.floor((Math.random() * 10));
            var pos = no % 10;
            if(randomness[pos] == 0) {
                randomness[pos] = 1;
                randomSoFar += 1;
            }
        }
    }

    function prepareCurrentImage() {
        getNextImageIndex();
        $scope.currentImage = images[currentImageIndex];
    }

    $scope.getIndex = function(index) {
        return "question_" + index.toString();
    }

    function buzz() {
        $scope.sound.play();
    }

    // ================== page switching functions ======================
    function doPage(page) {

    }
    function showPage(page) {
        $scope.directionsShow = false;
        $scope.anagramShow = false;
        $scope.nameShow = false;
        $scope.sliderShow = false;
        $scope.quizShow = false;
        $scope.imagesShow = false;
        $scope.imagesDirectionsShow = false;
        $scope.imagesPrepareMsg = false;
        $scope.imagesError = false;
        $scope.correctAnswer = false;
        $scope.finish = false;
        $scope.anagramsDirectionsShow = false;

        switch(page) {
            case 'anagram':
                $scope.anagramShow = true;
                break;
            case 'name':
                $scope.nameShow = true;
                break;
            case 'slider':
                $scope.sliderShow = true;
                break
            case 'first_quiz':
                prepareFirstCurrentQuiz();
                $scope.quizShow = true;
                break
            case 'second_quiz':
                prepareSecondCurrentQuiz();
                $scope.quizShow = true;
                break
            case 'imagesDirections':
                $scope.imagesDirectionsShow = true;
                break;
            case 'images':
                prepareCurrentImage();
                $scope.imagesShow = true;
                break;
            case 'prepareMsg':
                $scope.imagesPrepareMsg = true;
                break;
            case 'imagesError':
                $scope.imagesError = true;
                break;
            case 'finish':
                stopTimer();
                $scope.finishPage = true;
                break;
            case 'correctAnswer':
                $scope.correctAnswer = true;
                break;
            case 'directions':
                $scope.directionsShow = true;
                break;
        }
    }

    function setDirectionsCallbackInfo(nextPage, callback) {
        globalNextPage = nextPage;
        globalNextPageCallback = callback;
    }

    function setDirectionsText(message, buttonText) {
        $scope.messageText = message;
        $scope.buttonText = buttonText;
    }

    // ====================== init stuff ==================
    psihoService.getAnagrams().success(function(res) {
        anagrams = res;
        $scope.currentAnagram = anagrams[currentAnagramIndex].anagram;
        var currentImageIndex = 0;
    });
    psihoService.getQuizes().success(function(res) {
        first_quizes = res;
        angular.copy(res, second_quizes);

    });
    psihoService.getImages().success(function(res) {
        images = res;
    });
    $scope.sound = ngAudio.load("/static/sounds/fail.mp3");
    resetSliders();
    showPage("name");


    // ====================== PAGES ========================
    // ==================== name page ======================
    $scope.registerName = function() {
        if(!$scope.participantName) {
            alert("Acest camp este obligatoriu");
            return;
        }

        setDirectionsText(MESSAGES.INTRO.message, MESSAGES.INTRO.buttonText);
        setDirectionsCallbackInfo("slider", null);
        showPage("directions");
    }

    // =================== stress page ======================
    $scope.registerStress = function() {
        if(fromImages) {
            secondStress = $scope.feeling;

            showPage("first_quiz");
        } else {
            firstStress = $scope.feeling;
            resetSliders();
            setDirectionsCallbackInfo("", $scope.nextImage);
            setDirectionsText(MESSAGES.IMAGES.message, MESSAGES.IMAGES.buttonText);
            showPage('directions');
        }
        $scope.registeredStress = 0;
    }

    $scope.nextPage = function() {
        showPage(globalNextPage);
        if(globalNextPageCallback) {
            globalNextPageCallback();
        }
    }

    $scope.answerAnagram = function() {

        if(!$scope.userAnagramInput) {
            alert("Campul este obligatoriu");
            return;
        }

        anagrams[currentAnagramIndex].user_answer = $scope.userAnagramInput;
        if($scope.userAnagramInput === anagrams[currentAnagramIndex].correct &&
                currentAnagramIndex != anagrams.length - 1) {
            showPage('correctAnswer');
            var nextPage = "anagram";
            if(anagrams.length == currentAnagramIndex + 1) {
                nextPage = "second_quiz";
                stopTimer();
                lastAnagramTime = $scope.time;
            }

            $timeout(function() {
                showPage(nextPage);
            }, 1000);
            if(nextPage === "second_quiz") {
                return;
            }

            currentAnagramIndex += 1;
            $scope.currentAnagram = anagrams[currentAnagramIndex].anagram;
            $scope.userAnagramInput = "";
        } else {
            $scope.showErrorText = true;
            $scope.imagesErrorMsg = "Gresit!";
            buzz();
            showPage('imagesError');
            var nextPage = "anagram";
            $timeout(function() {
                showPage(nextPage);
            }, 1000);
        }
        if(currentAnagramIndex == anagrams.length - 1 && timerStarted == false) {
            console.log("timer started");
            startTimer();
        }
        $scope.userAnagramInput = "";
    }

    $scope.skipAnagram = function() {
        $scope.userAnagramInput = "";
        anagrams[currentAnagramIndex].user_answer = ">> skipped <<";
        if(anagrams.length == currentAnagramIndex + 1) {
            lastAnagramTime = $scope.time;
            showPage('second_quiz');
            first_quiz = false;
            second_quiz = true;
        } else {
            currentAnagramIndex += 1;
            $scope.currentAnagram = anagrams[currentAnagramIndex].anagram;
        }
        if(currentAnagramIndex == anagrams.length - 1 && timerStarted == false) {
            console.log("timer started");
            startTimer();
        } else  {
            stopTimer();
        }
    }

    // ================ quiz page ====================
    $scope.submitQuiz = function() {
        for(question in $scope.currentQuiz.questions) {
            if($scope.currentQuiz.questions[question].option === "" ||
                    angular.isUndefined($scope.currentQuiz.questions[question].option)) {
                alert("Please fill out all questions");
                return;
            }
        }
        if(currentQuizIndex + 1 == first_quizes.length) {
            if(first_quiz) {
                setDirectionsCallbackInfo("anagram", null);
                $scope.messageText = MESSAGES.PAUZA_ASISTENT.message;
                $scope.buttonText = MESSAGES.PAUZA_ASISTENT.buttonText;
                showPage('directions');
                first_quiz = false;
                second_quiz = true;
            } else {
                showPage("finish");
                sendData();
            }
        } else {
            currentQuizIndex += 1;
            if(first_quiz) {
                $scope.currentQuiz = first_quizes[currentQuizIndex];
            } else {
                $scope.currentQuiz = second_quizes[currentQuizIndex];
            }
        }
    }

    // ============== Images page =======================
    function setImagesTimeout() {
        imagesTimeout = $timeout(function() {
            $scope.showErrorText = true;
            buzz();
            showPage('imagesError');
            $timeout(function() {
                $scope.showErrorText = false;
                $scope.nextImage();
            }, 3000);
        }, 15000);
    }

    $scope.nextImage = function(buzz_enabled) {
        $timeout.cancel(imagesTimeout);

        if(imageCount == 0) {
            generateRandomness();
            imageCount = 1;
            showPage('prepareMsg');
            $timeout(function() {
                showPage('images');
                setImagesTimeout();
            }, 4000);
            return;
        }

        if(buzz_enabled) {
            var no = Math.random();
            if(randomness[imageCount - 1] == 1) {
                buzz();
            }
        }
        if(imageCount == 10) {
            generateRandomness();
            imageCount = 1;
            $scope.series += 1;
            if($scope.series == 5) {
                showPage('slider');
                fromImages = true;
                return;
            }
            showPage('prepareMsg');
            $timeout(function() {
                showPage('images');
                setImagesTimeout();
            }, 4000);
            return;
        }

        showPage('imagesError');
        $timeout(function() {
            showPage('images');
        }, 100);
        getNextImageIndex();
        $scope.currentImage = images[currentImageIndex];
        imageCount += 1;
        setImagesTimeout();
    }

}]);
