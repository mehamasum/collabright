from django.shortcuts import render

def react(request, path=None):
  return render(request, "index.html")