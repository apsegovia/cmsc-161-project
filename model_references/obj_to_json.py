import json

class OBJMesh:
    def __init__(self, name):
        self.name = name

        self.vertices = []
        self.normals = []
        self.uvs = []
        self.indices = []

        # maps (v,vt,vn) -> final vertex index
        self.vertex_map = {}

def parse_obj(filepath):
    raw_vertices = []
    raw_normals = []
    raw_uvs = []

    meshes = {}
    current_mesh = None

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            parts = line.split()

            prefix = parts[0]

            # OBJECT
            if prefix == "o":
                name = parts[1]

                current_mesh = OBJMesh(name)
                meshes[name] = current_mesh

            # VERTEX
            elif prefix == "v":
                x, y, z = map(float, parts[1:4])
                raw_vertices.append((x, y, z))

            # NORMAL
            elif prefix == "vn":
                x, y, z = map(float, parts[1:4])
                raw_normals.append((x, y, z))

            # UV
            elif prefix == "vt":
                u, v = map(float, parts[1:3])
                raw_uvs.append((u, v))

            # FACE
            elif prefix == "f":
                for face_vertex in parts[1:]:

                    v_idx, vt_idx, vn_idx = map(int, face_vertex.split("/"))

                    key = (v_idx, vt_idx, vn_idx)

                    # reuse existing vertex
                    if key in current_mesh.vertex_map:
                        final_index = current_mesh.vertex_map[key]

                    else:
                        final_index = len(current_mesh.vertices) // 4

                        current_mesh.vertex_map[key] = final_index

                        vx, vy, vz = raw_vertices[v_idx - 1]
                        nx, ny, nz = raw_normals[vn_idx - 1]
                        u, v = raw_uvs[vt_idx - 1]

                        # vec4 position
                        current_mesh.vertices.extend([
                            vx, vy, vz, 1.0
                        ])

                        # vec4 normal
                        current_mesh.normals.extend([
                            nx, ny, nz, 0.0
                        ])

                        # vec2 uv
                        current_mesh.uvs.extend([
                            u, v
                        ])

                    current_mesh.indices.append(final_index)

    return meshes

# main part

meshes = parse_obj("./model_references/project_models.obj")

# JSON
output = {}

for name, mesh in meshes.items():
    output[name] = {
        "vertices": mesh.vertices,
        "normals": mesh.normals,
        "uvs": mesh.uvs,
        "indices": mesh.indices
    }

with open("model.json", "w") as f:
    json.dump(output, f, indent=2)

print("\nExported model.json")