import json
import datetime

from os import listdir
from os.path import isfile, join

from flask import Flask, render_template, request, Response

app = Flask(__name__)


@app.route('/test/', methods=['GET'])
def anagrams_page():
    return render_template('anagrams.html')


@app.route('/anagrams.json', methods=['GET'])
def get_anagrams():
    data = []
    with open('data/display_data/anagrams.txt', 'r') as file_:
        for row in file_:
            correct_word, anagram = row.split()
            data.append({'correct': correct_word, 'anagram': anagram})

    return json.dumps(data)


@app.route('/quiz.json', methods=['GET'])
def get_quiz():
    with open('data/display_data/quiz.txt', 'r') as file_:
        is_desc = True
        header = False
        quizes = []
        options = []
        questions = []
        question_count = option_count = 0
        for row in file_:
            row = row.strip()
            if is_desc:
                description = row
                is_desc = False
                header = True
            elif header:
                for text in row.split(','):
                    options.append({'text': text, 'index': option_count})
                    option_count += 1
                header = False
            elif not row:
                quizes.append({
                    "options": options,
                    "questions": questions,
                    "description": description
                })
                options = []
                questions = []
                question_count = option_count = 0
                is_desc = True
                header = False
            else:
                questions.append({'text': row, 'index': question_count})
                question_count += 1

    return json.dumps(quizes)


@app.route("/data.json", methods=['POST'])
def get_data():
    import pprint
    pprint.pprint(request.json)
    data = request.json
    file_name = "data/result_data/{} - {}.csv".format(
        data['name'], datetime.datetime.now().strftime("%y-%M-%M %H-%M-%S"))
    with open(file_name, 'w') as user_file:
        user_file.write("Nume,{}\n".format(data['name'].encode('utf8')))
        user_file.write("Prima masurare a emotiilor\n")

        for key in data['first_stress']:
            user_file.write("{},{}\n".format(
                key.title(), data['first_stress'][key]).encode('utf8'))
        user_file.write("\n")

        user_file.write("A doua masurare a emotiile\n")
        for key in data['second_stress']:
            user_file.write("{},{}\n".format(
                key.title(), data['second_stress'][key]).encode('utf8'))
        user_file.write("\n")

        user_file.write("\n\nRezultate formulare\n\nPrimul formular\n\n")
        user_file.write("Intrebare,Raspunsul subiectului")
        for quiz in data['first_quiz']:
            user_file.write("\nDescriere,{}\n".format(
                quiz['description'].encode('utf8')))
            for question in quiz['questions']:
                user_file.write("{},{}\n".format(
                    question['text'].encode('utf8'),
                    question['option'].encode('utf8')))

        user_file.write("\n\nAl doilea formular\n\n")
        user_file.write("Intrebare,Raspunsul subiectului")
        for quiz in data['second_quiz']:
            user_file.write("\nDescriere,{}\n".format(
                quiz['description'].encode('utf8')))
            for question in quiz['questions']:
                user_file.write("{},{}\n".format(
                    question['text'].encode('utf8'),
                    question['option'].encode('utf8')))

        user_file.write("\n\nAnagrame\n\n")
        user_file.write("Timpul petrecut la ultima anagrama,{}\n".format(
            data['last_anagram_time']))
        user_file.write("Anagrama,Raspunsul corect,Raspunsul subiectului\n")
        for anagram in data['anagrams']:
            user_file.write("{},{},{}\n".format(
                anagram['anagram'].encode('utf8'),
                anagram['correct'].encode('utf8'),
                anagram['user_answer'].encode('utf8')))

    return Response(status=200)


@app.route('/images.json', methods=['GET'])
def get_images():
    path = 'static/images'
    images = ["/{}/{}".format(path, f) for f in listdir(path)
              if isfile(join(path, f))]
    print images
    return json.dumps(images)


@app.route('/anagrams/log_data.json', methods=['POST'])
def write_anagram_log():
    data = request.json
    name = data['name']
    state = data['state']
    time = data['time']
    anagram = data['anagram']
    file_name = '{}_{}'.format(name,
                               datetime.datetime.now().strftime('%M-%d-%Y'))
    with open(file_name, 'a') as file_:
        file_.write('{},{},{}'.format(anagram, state, time))

    return Response(status=200)


if __name__ == '__main__':
    app.debug = True
    app.run()
