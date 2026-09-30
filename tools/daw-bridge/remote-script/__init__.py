from .jocyn_stem_importer import JOCYNStemImporter

def create_instance(c_instance):
    return JOCYNStemImporter(c_instance)
