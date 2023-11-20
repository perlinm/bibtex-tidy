{
  description = "Tidy bibtex files";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { nixpkgs, systems, ... }:
    let
      eachSystem = f:
        nixpkgs.lib.genAttrs (import systems)
        (system: f nixpkgs.legacyPackages.${system});
      nodePackages = import ./default.nix {
        inherit (nixpkgs) pkgs;
        system = builtins.currentSystem;
        nodejs = nixpkgs.legacyPackages.${builtins.currentSystem}.nodejs-14_x;
      };
    in {
      devShells = eachSystem
        (pkgs: { default = pkgs.mkShell { buildInputs = [ pkgs.nodejs ]; }; });
      defaultPackage = eachSystem (pkgs:
        pkgs.stdenv.mkDerivation {
          name = "bibtex-tidy";
          src = ./.;
          buildInputs = [ pkgs.nodejs ] ++ (builtins.attrValues nodePackages);
          buildPhase = ''
            npm run build
          '';
          installPhase = ''
            mkdir -p $out/bin
            cp -r * $out/bin/
          '';
        });
    };
}
