import numpy as np  # type: ignore[import]
from numpy import linalg


"""
Ricci-Foster Curvature

Harry Richman 2024
"""

def laplacian_matrix(A):
    Q = np.array(A)
    n = len(A)
    for i in range(n):
        # set diagonal entry
        Q[i, i] = sum(A[i])
        for j in range(i):
            # set off-diagonal entries
            Q[i, j] = Q[j, i] = - A[i][j]
    return Q

def unit_vec(i, n):
    e = np.zeros(n)
    e[i] = 1
    return e

def resistance_matrix(A):
    n = len(A)
    Q = laplacian_matrix(A)
    Qinv = linalg.pinv(Q)
    W = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            unit = unit_vec(i, n) - unit_vec(j, n)
            unitn = np.transpose(unit)
            W[i][j] = unitn @ Qinv @ unit
    return W

def node_resistance_curvature(A):
    n = len(A)
    curvature = [0 for _ in range(n)]
    w = resistance_matrix(A)
    for i in range(n):
        s = 0
        for j in range(n):
            if A[i][j] > 0:
                s += w[i][j] * A[i][j]
        curvature[i] = 1 - (0.5*s)
    return curvature
 
def foster_coefficients(A):
    n = len(A)
    coeffs = [[0 for _ in range(n)] for _ in range(n)]
    w = resistance_matrix(A)
    for i in range(n):
        for j in range(n):
            if A[i][j] > 0:
                coeffs[i][j] = 1 - w[i][j]
    return coeffs

    
def link_resistance_curvature(A):
    n = len(A)
    curvature = [[0 for _ in range(n)] for _ in range(n)]
    w = resistance_matrix(A)
    for i in range(n):
        di = sum(A[i])
        for j in range(n):
            dj = sum(A[j])
            if A[i][j] > 0:
                curvature[i][j] = 1 / di + 1 / dj - w[i][j]
    return curvature
