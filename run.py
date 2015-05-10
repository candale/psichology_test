import json
import datetime
import re
from os import listdir
from os.path import isfile, join

from flask import Flask, render_template, request, Response

app = Flask(__name__)


@app.route('/anagrams/', methods=['GET'])
def anagrams_page():
    return render_template('anagrams.html')


@app.route('/anagrams.json', methods=['GET'])
def get_anagrams():
    data = []
    with open('data/anagrams.txt', 'r') as file_:
        for row in file_:
            correct_word, anagram = row.split()
            data.append({'correct': correct_word, 'anagram': anagram})

    return json.dumps(data)


@app.route('/quiz.json', methods=['GET'])
def get_quiz():
    with open('data/quiz.txt', 'r') as file_:
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
    with open("{}.csv".format(data['name']), 'w') as user_file:
        user_file.write("Nume,{}\n".format(unicode(data['name'])))
        user_file.write(
            "Nivel de stres initial,{}".format(data['first_stress']))
        user_file.write(
            "Nivel de stres dupa test,{}".format(data['second_stress']))

        user_file.write("\n\nRezultate formulare\nPrimul formular\n")
        user_file.write("Intrebare,Raspunsul subiectului")
        for quiz in data['first_quiz']:
            user_file.write("\nDescriere,{}\n".format(
                unicode(quiz['description'])))
            for question in quiz['questions']:
                user_file.write("{},{}\n".format(unicode(question['text']),
                                                 unicode(question['option'])))

        user_file.write("Al doilea formular\n")
        user_file.write("Intrebare,Raspunsul subiectului")
        for quiz in data['second_quiz']:
            user_file.write("\nDescriere,{}\n".format(
                unicode(quiz['description'])))
            for question in quiz['questions']:
                user_file.write("{},{}\n".format(unicode(question['text']),
                                                 unicode(question['option'])))

        user_file.write("\n\nAnagrame\n\n")
        user_file.write("Timpul petrecut la ultima anagrama,{}".format(
            unicode(data['last_anagram_time'])))
        user_file.write("Anagrama,Raspunsul corect,Raspunsul subiectului")
        for anagram in data['anagrams']:
            user_file.write("{},{},{}\n".format(
                unicode(anagram['anagram']), unicode(anagram['correct']),
                unicode(anagram['user_answer'])))

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
