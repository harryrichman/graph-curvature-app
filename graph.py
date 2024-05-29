import json
from scipy import optimize
from curvature import (
    inf, 
    normalised_unweighted_curvature, 
    non_normalised_unweighted_curvature  # type: ignore[import]
)
from curvature import (
    steinerbergerCurvature, 
    RicciFlatGraph, 
    nodeResistanceCurvature, 
    linkResistanceCurvature
)


def Amat(n, m):
    res = [[0 for i in range(n+m)] for i in range(n*m)]
    for i in range(n):
        for j in range(i*m, (i+1)*m):
            res[j][i] = 1
    for i in range(n, n+m):
        for j in range(n*m):
            if (j % m) == (i-n):
                res[j][i] = 1
    return res

def eta(n, m):
    res = [0 for _ in range(n+m)]
    for i in range(1, n):
        res[i] = -1.0/(n-1)
    for i in range(n+1, n+m):
        res[i] = -1.0/(m-1)
    return res

def etap(n, m, p):
    res = [0 for i in range(n+m)]
    res[0] = -p
    res[n] = -p
    for i in range(1, n):
        res[i] = (p-1.0)/(n-1)
    for i in range(n+1, n+m):
        res[i] = (p-1.0)/(m-1)
    return res

def dist(i, j, A):
    if i == j:
        return 0
    if A[i][j] == 1:
        return 1
    for a in range(len(A)):
        if (A[i][a]+A[j][a]) == 2:
            return 2
    return 3

def d(x, y, A):
    res = []
    xnbs = [x]
    ynbs = [y]
    for i in range(len(A)):
        if A[x][i] == 1:
            xnbs.append(i)
        if A[y][i] == 1:
            ynbs.append(i)
    for i in xnbs:
        for j in ynbs:
            res.append(dist(i, j, A))
    return res

def ocurve(x, y, A):
    dx = sum(A[x])
    dy = sum(A[y])
    return 1 + optimize.linprog(
        c=eta(dx+1, dy+1), 
        A_ub=Amat(dx+1, dy+1), 
        b_ub=d(x, y, A), 
        bounds=(None, None)
    ).fun

def lazocurve(x, y, A, p):
    dx = sum(A[x])
    dy = sum(A[y])
    return 1 + optimize.linprog(
        c=etap(dx+1, dy+1, p), 
        A_ub=Amat(dx+1, dy+1), 
        b_ub=d(x, y, A), 
        bounds=(None, None)
    ).fun

def LLYcurv(x, y, A):
    d = max([sum(A[x]), sum(A[y])])
    return ((1.0*(d+1))/(1.0*d))*lazocurve(x, y, A, 1.0/(d+1))

def etanonnorm(n, m):
    res = [-1.0 for i in range(n+m)]
    res[0] = -m+1
    res[n] = -n+1
    return res

def nonnorm_ocurve(x, y, A):
    dx = sum(A[x])
    dy = sum(A[y])
    return dx + dy + optimize.linprog(
        c=etanonnorm(dx+1, dy+1), 
        A_ub=Amat(dx+1, dy+1), 
        b_ub=d(x, y, A), 
        bounds=(None, None)
    ).fun

def sign(x):
    return -1 if x < 0 else (1 if x > 0 else 0)

urls = (
  '/', 'index'
)

class index:
    def POST(self):
        # web.header('Access-Control-Allow-Origin', '*')
        user_data = web.input()
        try:
            AM = json.loads(user_data.am)
            V = json.loads(user_data.v)
            t = json.loads(user_data.t)
        except Exception:
            return '["error0"]'

        if t == 0:
            try:
                ret = list(range(len(V)))
            except Exception:
                return '["error3"]'
        elif t == 1:
            try:
                ret = non_normalised_unweighted_curvature(AM, inf)
                ret = [sign(j) for j in ret]
            except Exception:
                return '["error1"]'
        elif t == 2:
            try:
                ret = normalised_unweighted_curvature(AM, inf)
                ret = [sign(j) for j in ret]
            except Exception:
                return '["error4"]'
        elif t == 3:
            try:
                ret = non_normalised_unweighted_curvature(AM, inf)
            except Exception:
                return '["error5"]'
        elif t == 4:
            try:
                ret = normalised_unweighted_curvature(AM, inf)
            except Exception:
                return '["error6"]'
        elif t == 5:
            try:
                dimn = json.loads(user_data.d)
                if(dimn == 0):
                    return '["error8"]'
                elif(dimn < 0):
                    return '["error8b"]'
            except Exception:
                return '["error9"]'
            try:
                ret = ret = non_normalised_unweighted_curvature(AM, dimn)
            except Exception:
                return '["error7"]'
        elif t == 6:
            ret = dict()
            ret["AM"] = AM
            ret["ORC"] = [[0 for i in range(len(V))] for j in range(len(V))]
            for i in range(len(V)):
                for j in range(len(V)):
                    if AM[i][j] == 1:
                        ret["ORC"][i][j] = ocurve(i, j, AM)
        elif t == 7:
            try:
                dimn = json.loads(user_data.d)
                if(dimn == 0):
                    return '["error8"]'
                elif(dimn < 0):
                    return '["error8b"]'
            except Exception:
                return '["error9"]'
            try:
                ret = normalised_unweighted_curvature(AM, dimn)
            except Exception:
                return '["error11"]'

        elif t == 8:
            try:
                ret = dict()
                idlen = json.loads(user_data.idlen)
                ret["AM"] = AM
                ret["ORCI"] = [[0 for i in range(len(V))] for j in range(len(V))]
                if idlen < 0:
                    return '["error13a"]'
                elif idlen == 1:
                    return '["error13b"]'
                elif idlen > 1:
                    return '["error13c"]'
                for i in range(len(V)):
                    for j in range(len(V)):
                        if AM[i][j] == 1:
                            ret["ORCI"][i][j] = lazocurve(i, j, AM, idlen)
            except Exception:
                return '["error12"]'
        
        elif t == 9:
            try:
                ret = dict()
                ret["AM"] = AM
                ret["LLYC"] = [[0 for i in range(len(V))] for j in range(len(V))]

                for i in range(len(V)):
                    for j in range(len(V)):
                        if AM[i][j] == 1:
                            ret["LLYC"][i][j] = LLYcurv(i, j, AM)
            except Exception:
                return '["error14"]'

        elif t == 10:
            try:
                ret = dict()
                ret["AM"] = AM
                ret["NNLLYC"] = [[0 for i in range(len(V))] for j in range(len(V))]

                for i in range(len(V)):
                    for j in range(len(V)):
                        if AM[i][j] == 1:
                            ret["NNLLYC"][i][j] = nonnorm_ocurve(i, j, AM)
            except Exception:
                return '["error15"]'

        elif t == 11:
            try:
                C = steinerbergerCurvature(AM)
                ret = [round(C[i],3) for i in range(len(V))]
            except Exception as e:
                print(e)
                return '["error16"]'
            
        elif t == 12:
            try:
                ret = RicciFlatGraph(AM)
            except Exception as e:
                print(e)
                return '["error17"]'
            
        elif t == 13:
            try:
                C = nodeResistanceCurvature(AM)
                ret = [round(C[i],3) for i in range(len(V))]
            except Exception as e:
                print(e)
                return '["error18"]'

        elif t == 14:
            try:
                LRC = linkResistanceCurvature(AM)
                ret = dict()
                ret["AM"] = AM
                ret["LRC"] = [[0 for _ in range(len(V))] for _ in range(len(V))]

                for i in range(len(V)):
                    for j in range(len(V)):
                        ret["LRC"][i][j] = round( LRC[i][j], 3 )
            except Exception:
                return '["error19"]'
        return json.dumps(ret)
