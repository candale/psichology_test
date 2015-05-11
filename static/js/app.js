var PsihoApp = angular.module('PsihoApp', ['ngAudio', 'uiSlider'])

PsihoApp.config(function($interpolateProvider){
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
});


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
    var second_quiz = true;
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

    var firstStress = null;
    var secondStress = null;
    $scope.selectedQuestion = '';
    $scope.timer_running = true;
    $scope.time = 0;
    $scope.nameShow = true;
    $scope.series = 1;
    $scope.bgColor = "#0F9D58";
    $scope.imagesErrorMsg = 'Prea târziu';
    $scope.showErrorText = false;
    $scope.imagesError = false;
    $scope.registeredStress = 0;

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
        console.log(data);
        psihoService.sendData(data);
    }

    // ================= timer functions =================
    function timerDone() {
        alert('time up. do smth');
    }

    function stopTimer() {
        $window.clearInterval(intervalId);
    }

    function startTimer() {
        intervalId = $window.setInterval(function() {
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
                $scope.finishPage = true;
                break;
            case 'correctAnswer':
                $scope.correctAnswer = true;
                break;
            case 'anagramsDirections':
                $scope.anagramsDirectionsShow = true;
                break;
        }
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


    // ====================== PAGES ========================
    // ==================== name page ======================
    $scope.registerName = function() {
        if(!$scope.participantName) {
            alert("Acest camp este obligatoriu");
            return;
        }
        showPage('slider');
    }

    // =================== stress page ======================
    $scope.registerStress = function() {
        if(fromImages) {
            firstStress = $scope.registeredStress;
            showPage('anagramsDirections');
        } else {
            secondStress = $scope.registeredStress;
            showPage('first_quiz');
        }
        $scope.registeredStress = 0;
    }

    $scope.answerAnagram = function(init) {
        if(init == true) {
            showPage('anagram');
            return;
        }
        stopTimer();
        anagrams[currentAnagramIndex].user_answer = $scope.userAnagramInput;
        if($scope.userAnagramInput === anagrams[currentAnagramIndex].correct) {
            showPage('correctAnswer');
            var nextPage = "anagram";
            if(anagrams.length == currentAnagramIndex + 1) {
                nextPage = "second_quiz";
                first_quiz = false;
                second_quiz = true;
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
            if(anagrams.length == currentAnagramIndex + 1) {
                nextPage = "second_quiz";
                first_quiz = false;
                second_quiz = true;
                stopTimer();
                lastAnagramTime = $scope.time;
            }
            $timeout(function() {
                showPage(nextPage);
            }, 1000);
            if(nextPage == "second_quiz") {
                return;
            }
            currentAnagramIndex += 1;
            $scope.currentAnagram = anagrams[currentAnagramIndex].anagram;
            $scope.userAnagramInput = "";
        }
        if(currentAnagramIndex == first_quizes.length - 1) {
            startTimer();
        }
    }

    $scope.skipAnagram = function() {
        anagrams[currentAnagramIndex].user_answer = ">> skipped <<";
        if(anagrams.length == currentAnagramIndex + 1) {
            showPage('second_quiz');
        } else {
            currentAnagramIndex += 1;
            $scope.currentAnagram = anagrams[currentAnagramIndex].anagram;
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
                showPage('imagesDirections');
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
        }, 30000);
    }

    $scope.nextImage = function(buzz_enabled) {
        $timeout.cancel(imagesTimeout);
        if(buzz_enabled) {
            var no = Math.random();;
            if(no < 0.7) {
                buzz();
            }
        }
        if(imageCount == 0) {
            imageCount = 1;
            showPage('prepareMsg');
            $timeout(function() {
                showPage('images');
                setImagesTimeout();
            }, 4000);
            return;
        }
        if(imageCount == 10) {
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
