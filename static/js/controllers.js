// PsihoApp.controller('AnagramController', ['$scope', 'psihoService',
//  function($scope, psihoService) {
//     var anagrams = null;
//     var current_index = 0;

//     PsihoService.getAnagrams().success(function(res) {
//         anagrams = res;
//     });

//     $scope.currentAnagram = anagrams[current_index].anagram;

//     $scope.answer = function() {
//         if(user_input === anagrams[current_index].correct) {
//             current_index += 1;
//             $scope.anagram = anagrams[current_index].anagram;
//             // get time;
//         }
//     }

//     $scope.skip = function() {
//         current_index += 1;
//         $scope.anagram = anagrams[current_index].anagram;
//     }

// }]);
