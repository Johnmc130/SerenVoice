import os

def main():
    p = os.path.join('backend', 'data', 'public_datasets', 'RAVDESS')
    files = []
    for root, dirs, fs in os.walk(p):
        for f in fs:
            if f.lower().endswith('.wav'):
                files.append(os.path.join(root, f))
                if len(files) >= 20:
                    break
        if len(files) >= 20:
            break
    for fn in files:
        print(fn)

if __name__ == '__main__':
    main()
