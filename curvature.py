import numpy as np  # type: ignore[import]
import copy
# from numpy.linalg import eigvalsh  # type: ignore[import]
from numpy import linalg
from enum import Enum


"""
Steinerberger Curvature

Erin Law 2022
"""

def distanceMatrix(A):
    A = np.array(A)
    n = len(A)
    D = copy.deepcopy(A)
    An= copy.deepcopy(A)
    for x in range(n):
        An = A @ An
        for i in range(n):
            for j in range(i + 1):
                if An[i,j] > 0 and D[i,j] == 0 and i != j:
                    D[i,j] = D[j,i] = x + 2
    return D



"""
Node and Link resitance curvature by Erin Law
"""
def laplacianMatrix(A):
    A = np.array(A)
    n = len(A)
    Q = copy.deepcopy(A)
    An= copy.deepcopy(A)
    for _ in range(n):
        for i in range(n):
            for j in range(i + 1):
                if An[i,j]>0 and i!=j and Q[i,j]!=0:
                    Q[i,j]=Q[j,i]=-An[i,j]
                if i==j:
                   Q[i,j] = Q[j,i] = sum(An[i,])
    return Q
 
def unitVec(i, n):
    e = np.zeros(n)
    e[i] = 1
    return e
 
 
def effectiveResistance(A):
    A = np.array(A)
    n = len(A)
    Q = laplacianMatrix(A)
    Qi = linalg.pinv(Q)
    W = [[0 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            unit = unitVec(i, n) - unitVec(j, n)
            unitn = np.transpose(unit)
            W[i][j] = unitn@Qi@unit
    return W

def nodeResistanceCurvature(A):
    n = len(A)
    curvature = [0 for _ in range(n)]
    w = effectiveResistance(A)
    for i in range(n):
        s=0
        for j in range(n):
            if A[i][j] > 0:
                s += w[i][j]*A[i][j]
        curvature[i]=1-(0.5*s)
    return curvature
 
def foster_coefficients(A):
    n = len(A)
    coeffs = [[0 for _ in range(n)] for _ in range(n)]
    w = effectiveResistance(A)
    for i in range(n):
        for j in range(n):
            if A[i][j] > 0:
                coeffs[i][j] = 1 - w[i][j]
    return coeffs

    
def linkResistanceCurvature(A):
    n = len(A)
    curvature = [[0 for _ in range(n)] for _ in range(n)]
    w = effectiveResistance(A)
    for i in range(n):
        di = sum(A[i])
        for j in range(n):
            dj = sum(A[j])
            if A[i][j] > 0:
                curvature[i][j] = 1 / di + 1 / dj - w[i][j]
    return curvature
