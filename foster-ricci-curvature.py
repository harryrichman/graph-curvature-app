from flask import Flask, render_template, request
import json

from curvature import (
    nodeResistanceCurvature,
    linkResistanceCurvature,
    foster_coefficients
)

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "POST":
        return render_template("index.html")
    return render_template("index.html")

@app.route("/get-labels", methods=["POST"])
def get_labels():
    print("request.form:", request.form)
    user_data = request.form
    try:
        AM = json.loads(user_data['am'])
        V = json.loads(user_data['v'])
        t = json.loads(user_data['t'])
        print("Type =", t)
    except Exception:
        print("error triggered")
        return '["error0"]'

    if t == 1:
        # link resistance curvature
        try:
            LRC = linkResistanceCurvature(AM)
            ret = dict()
            ret["AM"] = AM
            ret["LRC"] = [[0 for _ in range(len(V))] for _ in range(len(V))]

            for i in range(len(V)):
                for j in range(len(V)):
                    ret["LRC"][i][j] = round(LRC[i][j], 3)
        except Exception:
            return '["error19"]'

    elif t == 2:
        # node resistance curvature
        try:
            print("AM =", AM)
            C = nodeResistanceCurvature(AM)
            ret = [round(C[i], 3) for i in range(len(V))]
        except Exception as e:
            print(e)
            return '["error18"]'

    elif t == 3:
        # foster coefficient
        try:
            FC = foster_coefficients(AM)
            ret = dict()
            ret["AM"] = AM
            ret["FC"] = [[0 for _ in range(len(V))] for _ in range(len(V))]

            for i in range(len(V)):
                for j in range(len(V)):
                    ret["FC"][i][j] = round(FC[i][j], 3)
        except Exception:
            return '["error19"]'
    else:
        print(f"error: type t={t} not recognized")
        return "error"
    return json.dumps(ret)

    # return (
    #     json.dumps({"success": True}),
    #     200,
    #     {"ContentType": "application/json"}
    # )

if __name__ == "__main__":
    app.run(debug=True)